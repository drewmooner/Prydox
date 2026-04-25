"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  formatEther,
  formatUnits,
  isAddress,
  maxUint256,
  parseEther,
  zeroAddress,
} from "viem";
import { useAccount, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { erc20Abi } from "@/lib/abi/erc20";
import { poolAbi, RATE_MODE_VARIABLE } from "@/lib/abi/pool";
import { poolDataProviderAbi } from "@/lib/abi/pool-data-provider";
import { wrappedTokenGatewayAbi } from "@/lib/abi/wrapped-gateway";
import { litvmLiteforge } from "@/lib/chain";
import {
  formatNativeAmountHuman,
  maxSpendableNativeWei,
  MIN_NATIVE_SUGGESTED_FOR_ERC20_DEPOSIT_WEI,
  NATIVE_ZKLTC_GAS_BUFFER_WEI,
} from "@/lib/native-gas";
import { getUnderlyingMeta, getUsdcUnderlying } from "@/lib/config-underlying";
import { clampGasEstimate, litvmFeeOverrides } from "@/lib/litvm-tx-fees";
import { parseDecimalToWei } from "@/lib/parse-decimal";
import { logTxDebug } from "@/lib/tx-debug-log";
import {
  addFailedBorrowCollateralWei,
  getFailedBorrowCollateralWei,
  reduceFailedBorrowCollateralWei,
} from "@/lib/failed-borrow-collateral";

const pool = prydoxConfig.pool as `0x${string}`;
const gateway = prydoxConfig.wrappedTokenGateway as `0x${string}`;
export type TxStatus = {
  state: "idle" | "pending" | "success" | "failed";
  message: string;
};

function pickErrorText(error: unknown): string {
  if (error == null) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const x = error as { shortMessage?: string; details?: string; message?: string };
    if (x.shortMessage?.trim()) return x.shortMessage.trim();
    if (x.details?.trim()) return x.details.trim();
    if (error instanceof Error && error.message.trim()) return error.message.trim();
  }
  return String(error);
}

function toUserFacingError(error: unknown, fallback: string): Error {
  const raw = pickErrorText(error);
  if (/user rejected|user denied|denied transaction|rejected transaction|rejected the request/i.test(raw)) {
    return new Error("Transaction cancelled in wallet.");
  }
  if (/wrong msgidx/i.test(raw)) {
    return new Error(
      "Network sequencer is out of sync (msgIdx mismatch). Retry in a few seconds.",
    );
  }
  if (/nonce too low|replacement transaction underpriced|already known/i.test(raw)) {
    return new Error(
      "Wallet nonce is out of sync (a previous tx is still pending or already sent). Confirm/cancel pending tx in wallet, then retry.",
    );
  }
  if (raw.trim().length === 0) return new Error(fallback);
  return new Error(raw);
}

function isMsgIdxError(error: unknown): boolean {
  return /wrong msgidx/i.test(pickErrorText(error));
}

function isTransientRpcError(error: unknown): boolean {
  const raw = pickErrorText(error);
  return /timed out|timeout|network|internal error|temporarily unavailable|gateway|429|503|fetch failed|connection/i.test(
    raw,
  );
}

export function usePoolTransactions() {
  const config = useConfig();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>({
    state: "idle",
    message: "",
  });

  /** After a successful tx, force pool market + wallet views to match chain state. */
  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallet-balances"] }),
      queryClient.invalidateQueries({ queryKey: ["pool-reserves"] }),
      queryClient.invalidateQueries({ queryKey: ["user-usdc-reserve"] }),
      queryClient.invalidateQueries({ queryKey: ["user-positions"] }),
      queryClient.invalidateQueries({ queryKey: ["borrow-eligibility"] }),
    ]);
    await queryClient.refetchQueries({
      queryKey: ["pool-reserves"],
      type: "all",
    });
  }, [queryClient]);

  const wait = useCallback(
    async (hash: `0x${string}`) => {
      try {
        await waitForTransactionReceipt(config, {
          hash,
          chainId: litvmLiteforge.id,
          pollingInterval: 2_000,
          timeout: 180_000,
        });
      } catch (e) {
        // Slow RPCs can time out while the tx is still pending/mined.
        const client = getPublicClient(config, { chainId: litvmLiteforge.id });
        if (!client) throw e;
        for (let i = 0; i < 8; i += 1) {
          const r = await client.getTransactionReceipt({ hash }).catch(() => null);
          if (r) return;
          await new Promise((resolve) => setTimeout(resolve, 2_000));
        }
        throw e;
      }
    },
    [config],
  );

  const supply = useCallback(
    async (asset: "USDC" | "LTC", amountHuman: string) => {
      if (!address) throw new Error("Connect your wallet");
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) throw new Error("RPC unavailable");

      // For zkLTC (native), use gateway depositETH flow
      if (asset === "LTC") {
        const amountWei = parseEther(amountHuman.replaceAll(",", ""));
        if (!amountWei || amountWei <= BigInt(0)) throw new Error("Enter a valid amount");

        const nativeBal = await client.getBalance({ address });
        const maxSpend = maxSpendableNativeWei(nativeBal);
        if (amountWei > nativeBal) {
          throw new Error(
            `Amount exceeds your native zkLTC balance. Balance: ${formatEther(nativeBal)} zkLTC.`,
          );
        }
        if (amountWei > maxSpend) {
          throw new Error(
            `Leave about ${formatNativeAmountHuman(NATIVE_ZKLTC_GAS_BUFFER_WEI)} zkLTC for network fees. Lower the amount or use MAX.`,
          );
        }

        setPending(true);
        setTxStatus({
          state: "pending",
          message: "Submitting zkLTC deposit transaction...",
        });
        try {
          const fee = await litvmFeeOverrides(client);

          // Deposit native zkLTC via gateway
          const h = await writeContractAsync({
            chainId: litvmLiteforge.id,
            address: gateway,
            abi: wrappedTokenGatewayAbi,
            functionName: "depositETH",
            args: [pool, address, 0],
            value: amountWei,
            gas: BigInt(5_000_000),
            ...fee,
          });
          await wait(h);
          await invalidate();
          setTxStatus({
            state: "success",
            message: "zkLTC deposit confirmed on-chain.",
          });
        } catch (e) {
          const err = toUserFacingError(e, "zkLTC deposit failed");
          setTxStatus({
            state: "failed",
            message: err.message,
          });
          throw err;
        } finally {
          setPending(false);
        }
        return;
      }

      // For USDC, use standard ERC-20 approve + supply flow
      const meta = await getUnderlyingMeta(client, asset);
      const amount = parseDecimalToWei(amountHuman, meta.decimals);
      if (!amount) throw new Error("Enter a valid amount");

      const nativeBefore = await client.getBalance({ address });
      if (nativeBefore < MIN_NATIVE_SUGGESTED_FOR_ERC20_DEPOSIT_WEI) {
        throw new Error(
          `Deposit needs two transactions (approve + supply). Gas is paid in native zkLTC only — ERC-20 ${asset} cannot pay fees. Your native zkLTC (~${formatNativeAmountHuman(nativeBefore)}) looks too low; add native zkLTC to this wallet for network fees.`,
        );
      }

      setPending(true);
      setTxStatus({
        state: "pending",
        message: `Submitting ${asset} deposit transaction...`,
      });
      try {
        const fee = await litvmFeeOverrides(client);

        let gasApprove = BigInt(2_000_000);
        try {
          gasApprove = clampGasEstimate(
            await client.estimateContractGas({
              account: address,
              address: meta.address,
              abi: erc20Abi,
              functionName: "approve",
              args: [pool, maxUint256],
            }),
            BigInt(2_000_000),
          );
        } catch {
          /* use fallback */
        }

        let h1: `0x${string}`;
        try {
          h1 = await writeContractAsync({
            chainId: litvmLiteforge.id,
            address: meta.address,
            abi: erc20Abi,
            functionName: "approve",
            args: [pool, maxUint256],
            gas: gasApprove,
            ...fee,
          });
        } catch (approveErr) {
          if (!isMsgIdxError(approveErr)) throw approveErr;
          await new Promise((resolve) => setTimeout(resolve, 2500));
          h1 = await writeContractAsync({
            chainId: litvmLiteforge.id,
            address: meta.address,
            abi: erc20Abi,
            functionName: "approve",
            args: [pool, maxUint256],
            gas: gasApprove,
            ...fee,
          });
        }
        await wait(h1);

        let gasSupply = BigInt(5_000_000);
        try {
          gasSupply = clampGasEstimate(
            await client.estimateContractGas({
              account: address,
              address: pool,
              abi: poolAbi,
              functionName: "supply",
              args: [meta.address, amount, address, 0],
            }),
            BigInt(5_000_000),
          );
        } catch {
          /* use fallback */
        }

        try {
          const h2 = await writeContractAsync({
            chainId: litvmLiteforge.id,
            address: pool,
            abi: poolAbi,
            functionName: "supply",
            args: [meta.address, amount, address, 0],
            gas: gasSupply,
            ...fee,
          });
          await wait(h2);
        } catch (supplyErr) {
          const raw =
            supplyErr instanceof Error ? supplyErr.message : String(supplyErr);
          if (/user rejected|denied|rejected/i.test(raw)) {
            throw supplyErr instanceof Error
              ? supplyErr
              : new Error(String(supplyErr));
          }
          throw new Error(
            supplyErr instanceof Error ? supplyErr.message : String(supplyErr),
          );
        }
        await invalidate();
        setTxStatus({
          state: "success",
          message: `${asset} deposit confirmed on-chain.`,
        });
      } catch (e) {
        const err = toUserFacingError(e, "Deposit failed");
        setTxStatus({
          state: "failed",
          message: err.message,
        });
        throw err;
      } finally {
        setPending(false);
      }
    },
    [address, config, invalidate, wait, writeContractAsync],
  );

  const withdraw = useCallback(
    async (asset: "USDC" | "LTC", amountHuman: string, useMax: boolean) => {
      if (!address) throw new Error("Connect your wallet");
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) throw new Error("RPC unavailable");

      // zkLTC was deposited via the wrapped token gateway → must withdraw via gateway
      if (asset === "LTC") {
        const amountWei = useMax ? maxUint256 : parseEther(amountHuman.replaceAll(",", ""));
        if (!useMax && (!amountWei || amountWei <= BigInt(0))) {
          throw new Error("Enter a valid amount");
        }

        setPending(true);
        setTxStatus({ state: "pending", message: "Preparing zkLTC withdrawal…" });
        try {
          const fee = await litvmFeeOverrides(client);

          const weth = await client.readContract({
            address: gateway,
            abi: wrappedTokenGatewayAbi,
            functionName: "getWETHAddress",
          });
          const reserveTokens = await client.readContract({
            address: prydoxConfig.poolDataProvider as `0x${string}`,
            abi: poolDataProviderAbi,
            functionName: "getReserveTokensAddresses",
            args: [weth],
          });
          const aWeth = reserveTokens[0] as `0x${string}`;

          setTxStatus({ state: "pending", message: "Approve aWETH in wallet…" });
          const hAp = await writeContractAsync({
            chainId: litvmLiteforge.id,
            address: aWeth,
            abi: erc20Abi,
            functionName: "approve",
            args: [gateway, maxUint256],
            gas: BigInt(2_000_000),
            ...fee,
          });
          await wait(hAp);

          setTxStatus({ state: "pending", message: "Confirm zkLTC withdrawal in wallet…" });
          const h = await writeContractAsync({
            chainId: litvmLiteforge.id,
            address: gateway,
            abi: wrappedTokenGatewayAbi,
            functionName: "withdrawETH",
            args: [pool, amountWei, address],
            gas: BigInt(5_000_000),
            ...fee,
          });
          await wait(h);
          await invalidate();
          setTxStatus({ state: "success", message: "zkLTC withdrawal confirmed on-chain." });
        } catch (e) {
          const err = toUserFacingError(e, "zkLTC withdrawal failed");
          setTxStatus({ state: "failed", message: err.message });
          throw err;
        } finally {
          setPending(false);
        }
        return;
      }

      const meta = await getUnderlyingMeta(client, asset);
      const amount = useMax
        ? maxUint256
        : parseDecimalToWei(amountHuman, meta.decimals);
      if (!useMax && !amount) throw new Error("Enter a valid amount");

      setPending(true);
      setTxStatus({
        state: "pending",
        message: `Submitting ${asset} withdraw transaction...`,
      });
      try {
        const fee = await litvmFeeOverrides(client);
        let g = BigInt(450_000);
        try {
          g = clampGasEstimate(
            await client.estimateContractGas({
              account: address,
              address: pool,
              abi: poolAbi,
              functionName: "withdraw",
              args: [meta.address, amount ?? BigInt(0), address],
            }),
            BigInt(450_000),
          );
        } catch {
          /* fallback */
        }
        const h = await writeContractAsync({
          chainId: litvmLiteforge.id,
          address: pool,
          abi: poolAbi,
          functionName: "withdraw",
          args: [meta.address, amount ?? BigInt(0), address],
          gas: g,
          ...fee,
        });
        await wait(h);
        await invalidate();
        setTxStatus({
          state: "success",
          message: `${asset} withdraw confirmed on-chain.`,
        });
      } catch (e) {
        const err = toUserFacingError(e, "Withdraw failed");
        setTxStatus({
          state: "failed",
          message: err.message,
        });
        throw err;
      } finally {
        setPending(false);
      }
    },
    [address, config, invalidate, wait, writeContractAsync],
  );

  /** Native zkLTC collateral via gateway, then enable collateral, then borrow USDC — 3 required txs. */
  const depositNativeAndBorrow = useCallback(
    async (collateralZkLtc: string, borrowUsdc: string) => {
      if (!address) throw new Error("Connect your wallet");
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) throw new Error("RPC unavailable");
      const usdcMeta = await getUsdcUnderlying(client);

      const collateralWei = parseEther(collateralZkLtc.trim().replaceAll(",", ""));
      const borrowWei = parseDecimalToWei(borrowUsdc.trim(), usdcMeta.decimals);

      if (!collateralWei || collateralWei <= BigInt(0)) {
        throw new Error("Enter a collateral amount");
      }
      if (!borrowWei || borrowWei <= BigInt(0)) {
        throw new Error("Enter a borrow amount");
      }

      const nativeBal = await client.getBalance({ address });
      const maxSpendNow = maxSpendableNativeWei(nativeBal);
      if (collateralWei > nativeBal || collateralWei > maxSpendNow) {
        throw new Error(
          `Leave about ${formatNativeAmountHuman(NATIVE_ZKLTC_GAS_BUFFER_WEI)} zkLTC for fees. Lower the amount or use MAX.`,
        );
      }

      setPending(true);
      let borrowStep: "lock-collateral" | "enable-collateral" | "borrow-usdc" =
        "lock-collateral";
      let collateralLockConfirmed = false;
      try {
        const weth = await client.readContract({
          address: gateway,
          abi: wrappedTokenGatewayAbi,
          functionName: "getWETHAddress",
        });
        const readCollateralEnabled = async () => {
          const reserveData = await client.readContract({
            address: prydoxConfig.poolDataProvider as `0x${string}`,
            abi: poolDataProviderAbi,
            functionName: "getUserReserveData",
            args: [weth, address],
          });
          return Boolean(reserveData[8]);
        };

        // Tx 1 — lock zkLTC collateral
        setTxStatus({ state: "pending", message: "Step 1/3: Confirm zkLTC collateral lock in wallet…" });
        let h1: `0x${string}` | null = null;
        let lastLockErr: unknown = null;
        // On LiteForge, sequencer msgIdx can lag for tens of seconds.
        // Use longer progressive backoff to avoid failing step 1 prematurely.
        const lockBackoffMs = [2500, 5000, 8000, 12000, 18000, 25000];
        for (let attempt = 0; attempt < lockBackoffMs.length; attempt += 1) {
          try {
            const nativeBalLatest = await client.getBalance({ address });
            if (collateralWei > maxSpendableNativeWei(nativeBalLatest)) {
              throw new Error(
                `Not enough native zkLTC left for fees at submit time. Leave about ${formatNativeAmountHuman(NATIVE_ZKLTC_GAS_BUFFER_WEI)} zkLTC and retry.`,
              );
            }
            const fee1 = await litvmFeeOverrides(client);
            h1 = await writeContractAsync({
              chainId: litvmLiteforge.id,
              address: gateway,
              abi: wrappedTokenGatewayAbi,
              functionName: "depositETH",
              args: [pool, address, 0],
              value: collateralWei,
              gas: BigInt(5_000_000),
              ...fee1,
            });
            break;
          } catch (lockErr) {
            lastLockErr = lockErr;
            if (
              (!isMsgIdxError(lockErr) && !isTransientRpcError(lockErr)) ||
              attempt === lockBackoffMs.length - 1
            ) {
              throw lockErr;
            }
            setTxStatus({
              state: "pending",
              message: `Step 1/3: Network syncing (${attempt + 1}/${lockBackoffMs.length})... retrying collateral lock`,
            });
            await new Promise((resolve) => setTimeout(resolve, lockBackoffMs[attempt]));
          }
        }
        if (!h1) throw (lastLockErr ?? new Error("Collateral lock failed"));
        await wait(h1);
        collateralLockConfirmed = true;
        await invalidate();

        // Check whether reserve is already enabled as collateral.
        // Poll a few times to avoid stale RPC reads right after state changes.
        let collateralEnabledBefore = false;
        for (let i = 0; i < 3; i += 1) {
          const enabled = await readCollateralEnabled();
          if (enabled) {
            // Require a second confirming read before skipping enable tx.
            await new Promise((resolve) => setTimeout(resolve, 1200));
            const confirmEnabled = await readCollateralEnabled().catch(() => false);
            collateralEnabledBefore = confirmEnabled;
          } else {
            collateralEnabledBefore = false;
          }
          if (collateralEnabledBefore || !enabled) break;
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }

        // Tx 2 — enable WETH reserve as collateral (skip if already enabled)
        if (!collateralEnabledBefore) {
          borrowStep = "enable-collateral";
          setTxStatus({ state: "pending", message: "Step 2/3: Confirm enable zkLTC as collateral in wallet…" });
          let gasEnableCollateral = BigInt(2_000_000);
          try {
            gasEnableCollateral = clampGasEstimate(
              await client.estimateContractGas({
                account: address,
                address: pool,
                abi: poolAbi,
                functionName: "setUserUseReserveAsCollateral",
                args: [weth, true],
              }),
              BigInt(2_000_000),
            );
          } catch (estimateErr) {
            throw new Error(
              `Enable collateral precheck failed: ${pickErrorText(estimateErr)}`,
            );
          }
          const fee2 = await litvmFeeOverrides(client);
          const h2 = await writeContractAsync({
            chainId: litvmLiteforge.id,
            address: pool,
            abi: poolAbi,
            functionName: "setUserUseReserveAsCollateral",
            args: [weth, true],
            gas: gasEnableCollateral,
            ...fee2,
          });
          await wait(h2);
          await invalidate();
        }

        // Ensure collateral is enabled before trying borrow.
        let collateralEnabled = false;
        for (let i = 0; i < 6; i += 1) {
          collateralEnabled = await readCollateralEnabled().catch(() => false);
          if (collateralEnabled) break;
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
        if (!collateralEnabled) {
          throw new Error(
            "Collateral lock confirmed, but reserve is not enabled as collateral yet. Retry in a moment.",
          );
        }

        // Tx 3 — borrow USDC
        borrowStep = "borrow-usdc";
        setTxStatus({ state: "pending", message: "Step 3/3: Confirm USDC borrow in wallet…" });
        try {
          let gasBorrow = BigInt(5_000_000);
          try {
            gasBorrow = clampGasEstimate(
              await client.estimateContractGas({
                account: address,
                address: pool,
                abi: poolAbi,
                functionName: "borrow",
                args: [usdcMeta.address, borrowWei, RATE_MODE_VARIABLE, 0, address],
              }),
              BigInt(5_000_000),
            );
          } catch (estimateErr) {
            throw new Error(
              `Borrow precheck failed: ${pickErrorText(estimateErr)}`,
            );
          }
          const fee3 = await litvmFeeOverrides(client);
          const h3 = await writeContractAsync({
            chainId: litvmLiteforge.id,
            address: pool,
            abi: poolAbi,
            functionName: "borrow",
            args: [usdcMeta.address, borrowWei, RATE_MODE_VARIABLE, 0, address],
            gas: gasBorrow,
            ...fee3,
          });
          await wait(h3);
        } catch (borrowErr) {
          throw new Error(
            `Borrow failed after collateral lock. Repay/unlock from the Repay tab. ${pickErrorText(borrowErr)}`.trim(),
          );
        }

        await invalidate();
        const colHuman = Number(formatEther(collateralWei)).toLocaleString(undefined, { maximumFractionDigits: 6 });
        const brHuman = Number(formatUnits(borrowWei, usdcMeta.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });
        setTxStatus({ state: "success", message: `Borrow confirmed: locked ${colHuman} zkLTC, borrowed ${brHuman} USDC.` });
      } catch (e) {
        if (collateralLockConfirmed) {
          addFailedBorrowCollateralWei(address, collateralWei);
        }
        logTxDebug(
          "borrow_native_3step",
          {
            step: "depositNativeAndBorrow",
            actionStep: borrowStep,
            collateralZkLtc,
            borrowUsdc,
            account: address,
          },
          e,
        );
        await invalidate();
        const err = toUserFacingError(e, "Borrow failed");
        setTxStatus({ state: "failed", message: err.message });
        throw err;
      } finally {
        setPending(false);
      }
    },
    [address, config, invalidate, wait, writeContractAsync],
  );

  const repayUsdc = useCallback(
    async (amountHuman: string, repayAll: boolean) => {
      if (!address) throw new Error("Connect your wallet");
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) throw new Error("RPC unavailable");
      const usdcMeta = await getUsdcUnderlying(client);

      const amount = repayAll
        ? maxUint256
        : parseDecimalToWei(amountHuman, usdcMeta.decimals);
      if (!repayAll && !amount) throw new Error("Enter a valid amount");

      setPending(true);
      setTxStatus({
        state: "pending",
        message: "Submitting repay transaction...",
      });
      try {
        const fee = await litvmFeeOverrides(client);

        let gAp = BigInt(2_000_000);
        try {
          gAp = clampGasEstimate(
            await client.estimateContractGas({
              account: address,
              address: usdcMeta.address,
              abi: erc20Abi,
              functionName: "approve",
              args: [pool, maxUint256],
            }),
            BigInt(2_000_000),
          );
        } catch {
          /* fallback */
        }
        const h1 = await writeContractAsync({
          chainId: litvmLiteforge.id,
          address: usdcMeta.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [pool, maxUint256],
          gas: gAp,
          ...fee,
        });
        await wait(h1);

        let gRp = BigInt(5_000_000);
        try {
          gRp = clampGasEstimate(
            await client.estimateContractGas({
              account: address,
              address: pool,
              abi: poolAbi,
              functionName: "repay",
              args: [
                usdcMeta.address,
                amount ?? BigInt(0),
                RATE_MODE_VARIABLE,
                address,
              ],
            }),
            BigInt(5_000_000),
          );
        } catch {
          /* fallback */
        }
        const h2 = await writeContractAsync({
          chainId: litvmLiteforge.id,
          address: pool,
          abi: poolAbi,
          functionName: "repay",
          args: [
            usdcMeta.address,
            amount ?? BigInt(0),
            RATE_MODE_VARIABLE,
            address,
          ],
          gas: gRp,
          ...fee,
        });
        await wait(h2);
        await invalidate();
        setTxStatus({
          state: "success",
          message: "Repay confirmed on-chain.",
        });
      } catch (e) {
        const err = toUserFacingError(e, "Repay failed");
        setTxStatus({
          state: "failed",
          message: err.message,
        });
        throw err;
      } finally {
        setPending(false);
      }
    },
    [address, config, invalidate, wait, writeContractAsync],
  );

  /**
   * Aave-style liquidation call.
   * Liquidator repays a borrower's USDC debt and receives zkLTC collateral discount per pool rules.
   */
  const liquidateUsdcDebt = useCallback(
    async (user: `0x${string}`, debtAmountHuman: string, receiveAToken = false) => {
      if (!address) throw new Error("Connect your wallet");
      if (!isAddress(user) || user === zeroAddress) {
        throw new Error("Enter a valid borrower address");
      }
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) throw new Error("RPC unavailable");

      const usdcMeta = await getUsdcUnderlying(client);
      const debtToCover = parseDecimalToWei(debtAmountHuman, usdcMeta.decimals);
      if (!debtToCover || debtToCover <= BigInt(0)) {
        throw new Error("Enter a valid debt amount to liquidate");
      }

      const collateralAsset = await client.readContract({
        address: gateway,
        abi: wrappedTokenGatewayAbi,
        functionName: "getWETHAddress",
      });

      setPending(true);
      setTxStatus({
        state: "pending",
        message: "Submitting liquidation transaction...",
      });
      try {
        const fee = await litvmFeeOverrides(client);

        let gAp = BigInt(2_000_000);
        try {
          gAp = clampGasEstimate(
            await client.estimateContractGas({
              account: address,
              address: usdcMeta.address,
              abi: erc20Abi,
              functionName: "approve",
              args: [pool, maxUint256],
            }),
            BigInt(2_000_000),
          );
        } catch {
          /* fallback */
        }
        const hApprove = await writeContractAsync({
          chainId: litvmLiteforge.id,
          address: usdcMeta.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [pool, maxUint256],
          gas: gAp,
          ...fee,
        });
        logTxDebug(
          "liquidate_usdc_debt",
          {
            phase: "approve_submitted",
            txHash: hApprove,
            collateralAsset,
            debtToCover: debtToCover.toString(),
            account: address,
          },
          "ok",
        );
        await wait(hApprove);

        let gLq = BigInt(5_000_000);
        try {
          gLq = clampGasEstimate(
            await client.estimateContractGas({
              account: address,
              address: pool,
              abi: poolAbi,
              functionName: "liquidationCall",
              args: [collateralAsset, usdcMeta.address, user, debtToCover, receiveAToken],
            }),
            BigInt(5_000_000),
          );
        } catch {
          /* fallback */
        }

        const h = await writeContractAsync({
          chainId: litvmLiteforge.id,
          address: pool,
          abi: poolAbi,
          functionName: "liquidationCall",
          args: [collateralAsset, usdcMeta.address, user, debtToCover, receiveAToken],
          gas: gLq,
          ...fee,
        });
        await wait(h);
        await invalidate();
        setTxStatus({
          state: "success",
          message: "Liquidation confirmed on-chain.",
        });
      } catch (e) {
        const err = toUserFacingError(e, "Liquidation failed");
        setTxStatus({
          state: "failed",
          message: err.message,
        });
        throw err;
      } finally {
        setPending(false);
      }
    },
    [address, config, invalidate, wait, writeContractAsync],
  );

  const unlockNativeCollateralWei = useCallback(
    async (amountWei?: bigint) => {
      if (!address) throw new Error("Connect your wallet");
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) throw new Error("RPC unavailable");

      setPending(true);
      setTxStatus({
        state: "pending",
        message: "Preparing unlock transaction...",
      });
      try {
        // Get WETH address and aToken address
        const [weth, fee] = await Promise.all([
          client.readContract({
            address: gateway,
            abi: wrappedTokenGatewayAbi,
            functionName: "getWETHAddress",
          }),
          litvmFeeOverrides(client),
        ]);

        const reserveTokenAddresses = await client.readContract({
          address: prydoxConfig.poolDataProvider as `0x${string}`,
          abi: poolDataProviderAbi,
          functionName: "getReserveTokensAddresses",
          args: [weth],
        });
        const aWeth = reserveTokenAddresses[0] as `0x${string}`;

        // Resolve the exact aWETH balance first so unlock uses a real amount.
        const aWethBalance = await client.readContract({
          address: aWeth,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });

        // Use explicit amount if provided, otherwise unlock full aWETH balance.
        const parsed = amountWei ?? aWethBalance;
        if (!parsed || parsed <= BigInt(0)) {
          throw new Error("No locked zkLTC collateral found to unlock.");
        }
        if (parsed > aWethBalance) {
          throw new Error("Requested unlock amount exceeds your locked collateral balance.");
        }

        // Prefer direct withdraw first; only approve if allowance is actually blocking.
        const submitWithdraw = async () =>
          writeContractAsync({
            chainId: litvmLiteforge.id,
            address: gateway,
            abi: wrappedTokenGatewayAbi,
            functionName: "withdrawETH",
            args: [pool, parsed, address],
            gas: BigInt(5_000_000),
            ...fee,
          });
        const submitWithdrawWithRetry = async () => {
          try {
            return await submitWithdraw();
          } catch (withdrawErr) {
            if (!isMsgIdxError(withdrawErr) && !isTransientRpcError(withdrawErr)) {
              throw withdrawErr;
            }
            await new Promise((resolve) => setTimeout(resolve, 2_500));
            return await submitWithdraw();
          }
        };

        setTxStatus({
          state: "pending",
          message: "Step 1/2: Confirm unlock in wallet...",
        });
        const beforeUnlockBalance = aWethBalance;
        let h: `0x${string}`;
        try {
          h = await submitWithdrawWithRetry();
        } catch (withdrawErr) {
          const raw = pickErrorText(withdrawErr).toLowerCase();
          const needsApprove =
            /allowance|insufficient allowance|transfer amount exceeds allowance/.test(raw);
          if (!needsApprove) throw withdrawErr;

          setTxStatus({
            state: "pending",
            message: "Step 1/2: Approve aWETH in wallet...",
          });
          let hApprove: `0x${string}`;
          try {
            hApprove = await writeContractAsync({
              chainId: litvmLiteforge.id,
              address: aWeth,
              abi: erc20Abi,
              functionName: "approve",
              args: [gateway, maxUint256],
              gas: BigInt(300_000),
              ...fee,
            });
          } catch (approveErr) {
            if (!isMsgIdxError(approveErr)) throw approveErr;
            await new Promise((resolve) => setTimeout(resolve, 2_500));
            hApprove = await writeContractAsync({
              chainId: litvmLiteforge.id,
              address: aWeth,
              abi: erc20Abi,
              functionName: "approve",
              args: [gateway, maxUint256],
              gas: BigInt(300_000),
              ...fee,
            });
          }
          await wait(hApprove);
          setTxStatus({
            state: "pending",
            message: "Step 2/2: Confirm unlock in wallet...",
          });
          h = await submitWithdrawWithRetry();
        }
        try {
          await wait(h);
        } catch (waitErr) {
          // RPCs can time out while tx is already mined; verify by checking
          // receipt and aToken balance delta before declaring failure.
          let confirmedByChainState = false;
          for (let i = 0; i < 10; i += 1) {
            const receipt = await client.getTransactionReceipt({ hash: h }).catch(() => null);
            const afterBalance = await client
              .readContract({
                address: aWeth,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address],
              })
              .catch(() => null);
            if (receipt) {
              confirmedByChainState = true;
              break;
            }
            if (afterBalance !== null && afterBalance < beforeUnlockBalance) {
              confirmedByChainState = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 2_000));
          }
          if (!confirmedByChainState) throw waitErr;
        }
        reduceFailedBorrowCollateralWei(address, parsed);
        await invalidate();
        setTxStatus({
          state: "success",
          message: "zkLTC collateral unlocked.",
        });
      } catch (e) {
        // Sync UI with chain even when receipt waiting/errors are flaky.
        await invalidate();
        const raw = pickErrorText(e);
        const maybeMathRevert =
          /underflow|overflow|arithmetic/i.test(raw) &&
          "Unlock failed on-chain. This usually means a tiny debt amount is still open. Use Repay full debt, then unlock again.";
        const err = maybeMathRevert
          ? new Error(maybeMathRevert)
          : toUserFacingError(
              e,
              "Unlock failed. Repay any debt first, then try again.",
            );
        setTxStatus({
          state: "failed",
          message: err.message,
        });
        throw err;
      } finally {
        setPending(false);
      }
    },
    [address, config, invalidate, wait, writeContractAsync],
  );

  const unlockNativeCollateral = useCallback(
    async (amountHuman?: string) => {
      const parsed = amountHuman?.trim()
        ? parseEther(amountHuman.trim().replaceAll(",", ""))
        : undefined;
      await unlockNativeCollateralWei(parsed);
    },
    [unlockNativeCollateralWei],
  );

  const unlockFailedBorrowCollateral = useCallback(async () => {
    if (!address) throw new Error("Connect your wallet");
    const failedAmount = getFailedBorrowCollateralWei(address);
    if (!failedAmount || failedAmount <= BigInt(0)) {
      throw new Error("No failed borrow collateral to unlock.");
    }
    await unlockNativeCollateralWei(failedAmount);
  }, [address, unlockNativeCollateralWei]);

  const flashLoanSimple = useCallback(
    async (receiver: string, amountHuman: string) => {
      if (!address) throw new Error("Connect your wallet");
      if (!isAddress(receiver) || receiver === zeroAddress) {
        throw new Error("Enter a valid receiver contract address");
      }
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) throw new Error("RPC unavailable");
      const usdcMeta = await getUsdcUnderlying(client);

      const amount = parseDecimalToWei(amountHuman, usdcMeta.decimals);
      if (!amount) throw new Error("Enter a valid amount");

      setPending(true);
      setTxStatus({
        state: "pending",
        message: "Submitting flash loan transaction...",
      });
      try {
        const fee = await litvmFeeOverrides(client);
        let gFl = BigInt(1_200_000);
        try {
          gFl = clampGasEstimate(
            await client.estimateContractGas({
              account: address,
              address: pool,
              abi: poolAbi,
              functionName: "flashLoanSimple",
              args: [receiver as `0x${string}`, usdcMeta.address, amount, "0x", 0],
            }),
            BigInt(1_200_000),
          );
        } catch {
          /* fallback */
        }
        const h = await writeContractAsync({
          chainId: litvmLiteforge.id,
          address: pool,
          abi: poolAbi,
          functionName: "flashLoanSimple",
          args: [receiver as `0x${string}`, usdcMeta.address, amount, "0x", 0],
          gas: gFl,
          ...fee,
        });
        await wait(h);
        await invalidate();
        setTxStatus({
          state: "success",
          message: "Flash loan transaction confirmed on-chain.",
        });
      } catch (e) {
        const err = toUserFacingError(e, "Flash loan failed");
        setTxStatus({
          state: "failed",
          message: err.message,
        });
        throw err;
      } finally {
        setPending(false);
      }
    },
    [address, config, invalidate, wait, writeContractAsync],
  );

  return {
    supply,
    withdraw,
    depositNativeAndBorrow,
    unlockNativeCollateral,
    unlockFailedBorrowCollateral,
    repayUsdc,
    liquidateUsdcDebt,
    flashLoanSimple,
    pending,
    txStatus,
  };
}
