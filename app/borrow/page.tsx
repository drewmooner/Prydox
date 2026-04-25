"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "wagmi/actions";
import { formatUnits } from "viem";
import { useAccount, useConfig } from "wagmi";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { poolDataProviderAbi } from "@/lib/abi/pool-data-provider";
import { wrappedTokenGatewayAbi } from "@/lib/abi/wrapped-gateway";
import { litvmLiteforge } from "@/lib/chain";
import { TransactButton } from "@/components/transact-button";
import { ProtocolAppShell } from "@/components/protocol-app-shell";
import { useBorrowEligibility } from "@/hooks/use-borrow-eligibility";
import { usePoolReserves } from "@/hooks/use-pool-reserves";
import { usePoolTransactions } from "@/hooks/use-pool-transactions";
import { useUserPositions } from "@/hooks/use-user-positions";
import { useUserUsdcDebt } from "@/hooks/use-user-usdc-debt";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { formatApyPct } from "@/lib/aave-math";
import {
  clearFailedBorrowCollateralWei,
  getFailedBorrowCollateralWei,
} from "@/lib/failed-borrow-collateral";
import { maxSpendableNativeWei } from "@/lib/native-gas";

const COINGECKO_USDC_LOGO =
  "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png";
const COINGECKO_LTC_LOGO =
  "https://assets.coingecko.com/coins/images/2/large/litecoin.png";
const COLLATERAL_LTV = 0.7;
const BORROW_SAFETY_BUFFER = 0.97;
const MIN_COLLATERAL_ZKLTC = 0.5;

function fmtBal(
  pending: boolean,
  err: boolean,
  v: string | undefined,
): string {
  if (pending || err) return "—";
  return v ?? "—";
}

function fmtDebt(raw: string | undefined, pending: boolean) {
  if (pending || raw === undefined) return "—";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function parsePositive(v: string): number {
  const n = Number(v.replaceAll(",", "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function fmtNum(n: number, maxFrac = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function fmtUsd(n: number, maxFrac = 0): string {
  if (!Number.isFinite(n) || n < 0) return "$0";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: maxFrac })}`;
}

function shortAddr(addr: string | undefined): string {
  if (!addr) return "—";
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function useTicker(base: number, apyPct: number) {
  const [value, setValue] = useState(base);
  const ref = useRef(base);
  useEffect(() => {
    ref.current = base;
    setValue(base);
  }, [base]);
  useEffect(() => {
    const perSec = apyPct > 0 ? apyPct / 100 / (365 * 24 * 3600) : 0;
    const id = window.setInterval(() => {
      ref.current = ref.current + ref.current * perSec * 0.5;
      setValue(ref.current);
    }, 500);
    return () => window.clearInterval(id);
  }, [apyPct]);
  return value;
}

function CopyIconButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
      title="Copy"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

function Panel({
  title,
  badge,
  children,
}: {
  title?: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="p-1 md:p-2">
      {title || badge ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {title ? <h2 className="text-[15px] font-semibold text-[var(--fg)]">{title}</h2> : null}
          {badge ? (
            <span className="rounded-full bg-[var(--surface3)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent-bright)]">
              {badge}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function MiniCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="h-full p-2">
      {title ? (
        <p className="mb-3 font-mono-tight text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function FieldRow({
  label,
  right,
  children,
}: {
  label: string;
  right?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex justify-between text-[11px] text-[var(--muted)]">
        <span>{label}</span>
        {right ? (
          <span className="text-[var(--accent-bright)]">{right}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default function BorrowPage() {
  const config = useConfig();
  const { status, address } = useAccount();
  const [collateralAmount, setCollateralAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [txErr, setTxErr] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<{
    state: "pending" | "success" | "failed";
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"borrow" | "repay">("borrow");

  const {
    data: balances,
    isPending: balPending,
    isError: balErr,
  } = useWalletBalances();
  const { data: borrowEligibility } = useBorrowEligibility(collateralAmount);
  const { data: reserves } = usePoolReserves();
  const { data: debtRaw, isPending: debtPending } = useUserUsdcDebt();
  const { data: positions, isFetching: positionsRefreshing } = useUserPositions();
  const {
    depositNativeAndBorrow,
    repayUsdc,
    unlockNativeCollateral,
    unlockFailedBorrowCollateral,
    pending: txPending,
    txStatus,
  } = usePoolTransactions();
  const { data: debtTokenAddresses } = useQuery({
    queryKey: ["usdc-debt-token-addresses", prydoxConfig.poolDataProvider],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) return null;
      const tokens = await client.readContract({
        address: prydoxConfig.poolDataProvider as `0x${string}`,
        abi: poolDataProviderAbi,
        functionName: "getReserveTokensAddresses",
        args: [prydoxConfig.tokens.USDC as `0x${string}`],
      });
      return {
        aToken: tokens[0] as `0x${string}`,
        stableDebtToken: tokens[1] as `0x${string}`,
        variableDebtToken: tokens[2] as `0x${string}`,
      } as const;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const { data: lockedNativeCollateralWei = BigInt(0) } = useQuery({
    queryKey: ["locked-native-collateral", prydoxConfig.poolDataProvider, address, status],
    queryFn: async () => {
      if (status !== "connected" || !address) return BigInt(0);
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) return BigInt(0);
      const weth = await client.readContract({
        address: prydoxConfig.wrappedTokenGateway as `0x${string}`,
        abi: wrappedTokenGatewayAbi,
        functionName: "getWETHAddress",
      });
      const row = await client.readContract({
        address: prydoxConfig.poolDataProvider as `0x${string}`,
        abi: poolDataProviderAbi,
        functionName: "getUserReserveData",
        args: [weth, address as `0x${string}`],
      });
      return row[0] as bigint;
    },
    enabled: status === "connected",
    staleTime: 0,
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  });
  const { data: failedBorrowCollateralWei = BigInt(0) } = useQuery({
    queryKey: ["failed-borrow-collateral", address, status],
    queryFn: async () => {
      if (status !== "connected" || !address) return BigInt(0);
      return getFailedBorrowCollateralWei(address as `0x${string}`);
    },
    enabled: status === "connected",
    staleTime: 0,
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  });

  const toInputAmount = (v: string) => v.replaceAll(",", "");
  const busy = txPending;

  const nativeBal = fmtBal(balPending, balErr, balances?.native);
  const usdcBal = fmtBal(balPending, balErr, balances?.usdc);
  const variableDebtDisplay = fmtDebt(debtRaw, debtPending);
  const usdcReserve = reserves?.find((r) => r.symbol.toUpperCase() === "USDC");
  const borrowApy = usdcReserve?.variableBorrowApyPct ?? 0;
  const collateralAmountNum = parsePositive(collateralAmount);
  const repayAmountNum = parsePositive(repayAmount);
  const repayProjected = repayAmountNum > 0 ? repayAmountNum.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "0";
  const usdcSupplied = Number(usdcReserve?.totalSupplied ?? "0");
  const usdcBorrowed = Number(usdcReserve?.totalBorrowedVar ?? "0");
  const utilizationPct = usdcReserve?.utilizationPct ?? 0;
  const usdcUsd = usdcReserve?.usdPrice ?? borrowEligibility?.usdcUsd ?? 0;
  const availableLiquidityUsdc =
    Number.isFinite(usdcSupplied) && Number.isFinite(usdcBorrowed)
      ? Math.max(usdcSupplied - usdcBorrowed, 0)
      : 0;
  const totalPoolUsd = usdcReserve?.totalSuppliedUsd ?? usdcSupplied * usdcUsd;
  const availableLiquidityUsd = Math.max(totalPoolUsd - (usdcReserve?.totalBorrowedUsd ?? 0), 0);
  const nativeBalNum = parsePositive(nativeBal);
  const usdcBalNum = parsePositive(usdcBal);
  const maxBorrowNum = parsePositive(borrowEligibility?.maxBorrowUsdc ?? "0");
  const fullBorrowAt100PctNum =
    usdcUsd > 0 ? (collateralAmountNum * (borrowEligibility?.ltcUsd ?? 0)) / usdcUsd : 0;
  const rawBorrowAmountNum =
    collateralAmountNum > 0 ? fullBorrowAt100PctNum * COLLATERAL_LTV : 0;
  const cappedByAccount = maxBorrowNum > 0 ? Math.min(rawBorrowAmountNum, maxBorrowNum) : rawBorrowAmountNum;
  const cappedByLiquidity = availableLiquidityUsdc > 0 ? Math.min(cappedByAccount, availableLiquidityUsdc) : cappedByAccount;
  const borrowAmountNum = cappedByLiquidity * BORROW_SAFETY_BUFFER;
  const borrowAmount =
    borrowAmountNum > 0
      ? borrowAmountNum.toFixed(6).replace(/\.?0+$/, "")
      : "";
  const borrowProjected =
    borrowAmountNum > 0
      ? borrowAmountNum.toLocaleString(undefined, { maximumFractionDigits: 6 })
      : "0";
  const projectedBorrowUsd = borrowAmountNum * usdcUsd;
  const borrowProjectedUsdLabel = fmtUsd(projectedBorrowUsd, 2);
  const estimatedYearlyInterestUsdc =
    borrowAmountNum > 0 ? borrowAmountNum * (borrowApy / 100) : 0;
  const debtNum = parsePositive(variableDebtDisplay === "—" ? "0" : variableDebtDisplay);
  const liveDebtNum = useTicker(debtNum, borrowApy);
  const liveAccruedNum = Math.max(liveDebtNum - debtNum, 0);
  const hasAnyPosition = Boolean(
    positions &&
      (positions.usdc.suppliedWei > BigInt(0) ||
        positions.ltc.suppliedWei > BigInt(0) ||
        positions.zkltc.suppliedWei > BigInt(0) ||
        positions.usdc.variableDebtWei > BigInt(0) ||
        positions.ltc.variableDebtWei > BigInt(0) ||
        positions.zkltc.variableDebtWei > BigInt(0)),
  );
  const lockedCollateralWei = lockedNativeCollateralWei;
  const lockedCollateralNum = Number(formatUnits(lockedCollateralWei, 18));
  const hasAnyLockedOnChain = lockedCollateralWei > BigInt(0);
  const failedLockedCollateralWei =
    failedBorrowCollateralWei > lockedCollateralWei
      ? lockedCollateralWei
      : failedBorrowCollateralWei;
  const failedLockedCollateralNum = Number(formatUnits(failedLockedCollateralWei, 18));
  const hasTrackedFailedLockedCollateral = failedLockedCollateralWei > BigInt(0);
  const hasLockedCollateral = hasTrackedFailedLockedCollateral;
  const hasFailedBorrowUnlockFallback =
    txStatus.state === "failed" &&
    txStatus.message.toLowerCase().includes("borrow failed after collateral lock") &&
    !hasTrackedFailedLockedCollateral &&
    hasAnyLockedOnChain;
  const showLockedAfterFailedBorrowNotice =
    txStatus.state === "failed" &&
    txStatus.message.toLowerCase().includes("borrow failed after collateral lock") &&
    (hasLockedCollateral || hasFailedBorrowUnlockFallback);
  const unlockRecoveryMode =
    showLockedAfterFailedBorrowNotice ||
    (debtNum <= 0 && (hasLockedCollateral || hasFailedBorrowUnlockFallback));
  const showPositionDetails = status === "connected" && hasAnyPosition;
  const hasInsufficientCollateralBalance =
    collateralAmountNum > 0 && nativeBalNum > 0 && collateralAmountNum > nativeBalNum;
  const hasInsufficientRepayBalance =
    repayAmountNum > 0 && usdcBalNum > 0 && repayAmountNum > usdcBalNum;
  const canBorrow =
    !busy &&
    collateralAmountNum > 0 &&
    !hasInsufficientCollateralBalance &&
    borrowAmountNum > 0;
  const canRepay =
    !busy &&
    repayAmountNum > 0 &&
    usdcBalNum > 0 &&
    debtNum > 0 &&
    repayAmountNum <= usdcBalNum;
  const canRepayAll = !busy && usdcBalNum > 0 && debtNum > 0;
  const health = positions?.account?.healthFactor ?? "—";
  const collateralUsd = positions?.account?.totalCollateralUsd ?? "—";
  const debtUsd = positions?.account?.totalDebtUsd ?? "—";

  useEffect(() => {
    if (!txErr) return;
    const t = setTimeout(() => setTxErr(null), 3200);
    return () => clearTimeout(t);
  }, [txErr]);

  useEffect(() => {
    if (txStatus.state === "idle") return;
    setStatusToast({ state: txStatus.state, message: txStatus.message });
    if (txStatus.state === "pending") return;
    const t = setTimeout(() => setStatusToast(null), 3200);
    return () => clearTimeout(t);
  }, [txStatus]);

  // If chain state shows no locked collateral, clear stale failed-lock tracker.
  useEffect(() => {
    if (status !== "connected" || !address) return;
    if (lockedNativeCollateralWei !== BigInt(0)) return;
    if (failedBorrowCollateralWei === BigInt(0)) return;
    clearFailedBorrowCollateralWei(address as `0x${string}`);
  }, [address, failedBorrowCollateralWei, lockedNativeCollateralWei, status]);

  async function onBorrow() {
    setTxErr(null);
    try {
      await depositNativeAndBorrow(collateralAmount, borrowAmount);
      setCollateralAmount("");
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  async function onRepay() {
    setTxErr(null);
    try {
      if (debtNum <= 0) {
        throw new Error("No debt to repay.");
      }
      if (repayAmountNum > 0) {
        await repayUsdc(repayAmount, false);
      } else {
        await repayUsdc("", true);
      }
      setRepayAmount("");
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : "Repay failed");
    }
  }

  async function onUnlockFailedCollateral() {
    setTxErr(null);
    try {
      if (hasTrackedFailedLockedCollateral) {
        await unlockFailedBorrowCollateral();
      } else if (unlockRecoveryMode && hasAnyLockedOnChain) {
        await unlockNativeCollateral(formatUnits(lockedCollateralWei, 18));
      } else {
        throw new Error("No failed locked collateral to unlock.");
      }
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : "Unlock failed");
    }
  }

  function setCollateralPreset(value: "0.5" | "1" | "5" | "max") {
    if (value === "max") {
      const w = balances?.nativeWei;
      if (w === undefined) return;
      const max = maxSpendableNativeWei(w);
      if (max === BigInt(0)) return;
      setCollateralAmount(formatUnits(max, 18));
      return;
    }
    setCollateralAmount(value);
  }

  return (
    <ProtocolAppShell title="Borrow">
      <div className="pb-8">
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[860px] text-[13px] leading-relaxed text-[var(--muted)] md:text-[14px]">
            Access USDC liquidity by locking zkLTC as collateral, monitor your debt health in real time, and repay on demand from the same workflow.
          </p>
          <div className="ml-auto grid grid-cols-2 rounded-[10px] border border-[var(--border)] p-1 sm:w-[320px]">
            <button
              type="button"
              onClick={() => setActiveTab("borrow")}
              className={`rounded-[8px] px-3 py-2 text-[12px] font-bold transition ${
                activeTab === "borrow"
                  ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.16)] text-[#c7f3dd]"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              Borrow
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("repay")}
              className={`rounded-[8px] px-3 py-2 text-[12px] font-bold transition ${
                activeTab === "repay"
                  ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.16)] text-[#c7f3dd]"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              Repay
            </button>
          </div>
        </div>
        {txErr ? (
          <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-[10px] border border-[#5c2b2b] bg-[rgba(42,21,21,0.88)] px-3 py-2 text-[13px] text-[#f8a8a8] shadow-lg backdrop-blur-sm">
            {txErr}
          </div>
        ) : statusToast ? (
          <div
            className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-[10px] px-3 py-2 text-[13px] shadow-lg backdrop-blur-sm ${
              statusToast.state === "success"
                ? "border border-[#2b5c3a] bg-[rgba(21,42,31,0.88)] text-[#a8f8c2]"
                : statusToast.state === "failed"
                  ? "border border-[#5c2b2b] bg-[rgba(42,21,21,0.88)] text-[#f8a8a8]"
                  : "border border-[#2b3d5c] bg-[rgba(22,29,42,0.88)] text-[#a8c3f8]"
            }`}
          >
            {statusToast.message}
          </div>
        ) : null}

        <div className="mt-6 space-y-8">
          {activeTab === "borrow" ? (
          <div className="border-b border-white/10 pb-8">
            <Panel title="">
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <MiniCard title="">
                  <FieldRow label="zkLTC collateral">
                    <div className="flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] px-2.5 py-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        className="min-w-0 flex-1 bg-transparent font-mono-tight text-[14px] text-[var(--fg)] outline-none"
                      />
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface3)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                        <Image src={COINGECKO_LTC_LOGO} alt="zkLTC" width={16} height={16} className="rounded-full" />
                        zkLTC
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {(["0.5", "1", "5", "max"] as const).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCollateralPreset(preset)}
                          className="rounded-md border border-[var(--border)] bg-[var(--surface2)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
                        >
                          {preset === "max" ? "MAX" : preset}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      Wallet balance: {nativeBal} zkLTC
                    </p>
                    {hasInsufficientCollateralBalance ? (
                      <p className="mt-1 text-[10px] text-[#f8a8a8]">Insufficient balance</p>
                    ) : null}
                  </FieldRow>
                  <FieldRow
                    label="Borrow amount"
                    right={`100% collateral value ${fmtNum(fullBorrowAt100PctNum, 4)} USDC`}
                  >
                    <div className="flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] px-2.5 py-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={borrowProjectedUsdLabel}
                        readOnly
                        className="min-w-0 flex-1 bg-transparent font-mono-tight text-[14px] text-[var(--fg)] outline-none"
                      />
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface3)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                        <Image src={COINGECKO_USDC_LOGO} alt="USDC" width={16} height={16} className="rounded-full" />
                        USDC
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      Eligible at {Math.round(COLLATERAL_LTV * 100)}% LTV: {fmtNum(borrowAmountNum, 4)} USDC
                    </p>
                  </FieldRow>
                  <TransactButton
                    label={busy ? "Confirm in wallet…" : "Borrow USDC"}
                    variant="primary"
                    className="mt-1"
                    disabled={!canBorrow}
                    onClick={() => void onBorrow()}
                  />
                  {showLockedAfterFailedBorrowNotice ? (
                    <div className="mt-3 rounded-[10px] border border-[#5b4a2f] bg-[rgba(41,33,19,0.6)] p-3">
                      <p className="text-[12px] font-semibold text-[#f4d6a0]">
                        Collateral locked after failed borrow
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        Failed-lock amount: {fmtNum(failedLockedCollateralNum, 6)} zkLTC. Open the Repay tab to unlock this amount.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("repay")}
                        className="mt-2 rounded-[8px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.16)] px-2.5 py-1 text-[11px] font-semibold text-[#c7f3dd]"
                      >
                        Go to Repay tab
                      </button>
                    </div>
                  ) : null}
                </MiniCard>
              </div>

              <div className="lg:col-span-5">
                <MiniCard title="Borrow market">
                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Borrow APY</span>
                      <span className="text-[var(--warning)]">{formatApyPct(borrowApy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">LTV</span>
                      <span className="font-mono-tight text-[var(--fg)]">
                        {Math.round(COLLATERAL_LTV * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Pool utilization</span>
                      <span className="font-mono-tight text-[var(--fg)]">{fmtNum(utilizationPct, 2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Available liquidity</span>
                      <span className="font-mono-tight text-[var(--fg)]">
                        {fmtUsd(availableLiquidityUsd)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">You receive</span>
                      <span className="font-mono-tight text-[var(--fg)]">{fmtUsd(projectedBorrowUsd, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Est. yearly interest</span>
                      <span className="font-mono-tight text-[var(--fg)]">
                        {fmtUsd(estimatedYearlyInterestUsdc * usdcUsd, 2)}
                      </span>
                    </div>
                  </div>
                </MiniCard>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[var(--muted-2)]">
              Live stats refresh immediately on new blocks
              {positionsRefreshing ? " (syncing now…)." : "."}
            </p>
            </Panel>
          </div>
          ) : null}

          {activeTab === "repay" ? (
          <div>
            <Panel title="Repay">
            <div className="max-w-[560px]">
            <FieldRow label="USDC to repay" right={`Wallet: ${usdcBal} USDC`}>
              <div className="flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] px-2.5 py-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono-tight text-[14px] text-[var(--fg)] outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setRepayAmount(
                      debtNum > 0
                        ? debtNum.toFixed(6).replace(/\.?0+$/, "")
                        : "",
                    )
                  }
                  className="rounded-md border border-[var(--accent)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--accent-bright)] transition-colors hover:bg-[var(--surface3)]"
                >
                  MAX
                </button>
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface3)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                  <Image src={COINGECKO_USDC_LOGO} alt="USDC" width={16} height={16} className="rounded-full" />
                  USDC
                </span>
              </div>
            </FieldRow>
            {hasInsufficientRepayBalance ? (
              <p className="-mt-2 mb-3 text-[10px] text-[#f8a8a8]">Insufficient balance</p>
            ) : null}
            {hasLockedCollateral || hasFailedBorrowUnlockFallback ? (
              <div className="mb-3 rounded-[10px] border border-[#5b4a2f] bg-[rgba(41,33,19,0.6)] p-3">
                <p className="text-[12px] font-semibold text-[#f4d6a0]">
                  Unlock failed collateral
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  Recover {hasTrackedFailedLockedCollateral ? "failed borrow lock amount" : "detected locked amount"}:{" "}
                  {fmtNum(hasTrackedFailedLockedCollateral ? failedLockedCollateralNum : lockedCollateralNum, 6)} zkLTC.
                </p>
                <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                  This runs approve + unlock so you can recover and retry borrow.
                </p>
              </div>
            ) : null}
            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] p-3">
              {unlockRecoveryMode ? (
                <div className="flex justify-between border-b border-[var(--border)] py-2 text-[12px]">
                  <span className="text-[var(--muted)]">Collateral locked</span>
                  <span className="font-mono-tight text-[var(--fg)]">
                    {fmtNum(hasTrackedFailedLockedCollateral ? failedLockedCollateralNum : lockedCollateralNum, 6)} zkLTC
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-b border-[var(--border)] py-2 text-[12px]">
                <span className="text-[var(--muted)]">Variable debt (USDC)</span>
                <span className="font-mono-tight text-[var(--danger)]">
                  {variableDebtDisplay}
                </span>
              </div>
              <div className="flex justify-between py-2 text-[12px]">
                <span className="text-[var(--muted)]">Repay amount</span>
                <span className="font-mono-tight text-[var(--fg)]">
                  {repayProjected} USDC
                </span>
              </div>
            </div>
            <TransactButton
              label={busy ? "Confirm in wallet…" : "Repay USDC"}
              variant="primary"
              className="mt-4"
              disabled={!canRepay}
              onClick={() => void onRepay()}
            />
            {unlockRecoveryMode ? (
              <TransactButton
                label={busy ? "Confirm in wallet…" : "Unlock failed collateral"}
                variant="secondary"
                className="mt-2"
                disabled={busy || (!hasTrackedFailedLockedCollateral && !hasAnyLockedOnChain)}
                onClick={() => void onUnlockFailedCollateral()}
              />
            ) : null}
            </div>
            </Panel>
          </div>
          ) : null}
        </div>
      </div>
    </ProtocolAppShell>
  );
}
