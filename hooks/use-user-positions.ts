"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useAccount, useChainId, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { poolAbi } from "@/lib/abi/pool";
import { poolDataProviderAbi } from "@/lib/abi/pool-data-provider";
import { wrappedTokenGatewayAbi } from "@/lib/abi/wrapped-gateway";
import { getUnderlyingMeta } from "@/lib/config-underlying";
import { litvmLiteforge } from "@/lib/chain";

const BASE_CURRENCY_DECIMALS = 8;
const ZERO = BigInt(0);

export type UserReserveSnapshot = {
  symbol: "USDC" | "LTC" | "ZKLTC";
  supplied: string;
  suppliedWei: bigint;
  variableDebt: string;
  variableDebtWei: bigint;
  stableDebt: string;
  stableDebtWei: bigint;
  usageAsCollateral: boolean;
};

export type UserAccountSnapshot = {
  /** Oracle-priced collateral (base currency, ~USD). */
  totalCollateralUsd: string;
  /** Oracle-priced debt (base currency, ~USD). */
  totalDebtUsd: string;
  /** Available to borrow (base currency). */
  availableBorrowsUsd: string;
  /** Health factor (unitless); null if no debt / not applicable. */
  healthFactor: string | null;
  /**
   * Weighted average LTV from `getUserAccountData` (depends on collateral mix).
   * Per-asset caps differ — see `maxLtvAsCollateral` on `UserPositionsData`.
   */
  weightedLtv: string;
  /** Current liquidation threshold from account data. */
  liquidationThreshold: string;
};

export type UserPositionsData = {
  usdc: UserReserveSnapshot;
  ltc: UserReserveSnapshot;
  zkltc: UserReserveSnapshot;
  account: UserAccountSnapshot | null;
  /** Max borrow vs collateral, per reserve (`getReserveConfigurationData.ltv`). */
  maxLtvAsCollateral: { USDC: string; LTC: string; ZKLTC: string };
};

function fmtAmt(raw: bigint, decimals: number, maxFrac = 6): string {
  const n = Number(formatUnits(raw, decimals));
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  if (n < 1e-8) return "<0.000001";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: Math.min(maxFrac, decimals),
    minimumFractionDigits: 0,
  });
}

function fmtUsdBase(raw: bigint): string {
  const n = Number(formatUnits(raw, BASE_CURRENCY_DECIMALS));
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1000).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtHealthFactor(hf: bigint, totalDebtBase: bigint): string | null {
  if (totalDebtBase === ZERO) return null;
  const MAX = BigInt(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
  );
  if (hf >= MAX - BigInt(1000)) return "∞";
  const n = Number(hf) / 1e18;
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n > 1e12) return "∞";
  return n.toFixed(2);
}

function fmtLtvRatio(ltvBps: bigint): string {
  const n = Number(ltvBps) / 10000;
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(0)}%`;
}

/** Reserve config `ltv` is in basis points (e.g. 7000 → 70%). */
function fmtReserveLtvBps(bps: bigint): string {
  const n = Number(bps) / 100;
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(0)}%`;
}

function hasPosition(p: UserPositionsData): boolean {
  const rows = [p.usdc, p.ltc, p.zkltc];
  for (const r of rows) {
    if (
      r.suppliedWei > ZERO ||
      r.variableDebtWei > ZERO ||
      r.stableDebtWei > ZERO
    ) {
      return true;
    }
  }
  return false;
}

/**
 * On-chain positions: supplied (aToken underlying), debt, collateral flags,
 * and pool account summary (HF, LTV) when the user has supplied or borrowed.
 */
export function useUserPositions() {
  const config = useConfig();
  const { address, status } = useAccount();
  const chainId = useChainId();
  const onLitvm = chainId === litvmLiteforge.id;
  const enabled =
    status === "connected" && Boolean(address) && onLitvm;

  const query = useQuery({
    queryKey: [
      "user-positions",
      address,
      chainId,
      prydoxConfig.pool,
      prydoxConfig.tokens.USDC,
      prydoxConfig.tokens.LTC,
      prydoxConfig.wrappedTokenGateway,
    ],
    queryFn: async (): Promise<UserPositionsData> => {
      if (!address) throw new Error("No account");

      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) throw new Error("No RPC client");

      const [usdcMeta, ltcMeta, gatewayWeth] = await Promise.all([
        getUnderlyingMeta(client, "USDC"),
        getUnderlyingMeta(client, "LTC"),
        client.readContract({
          address: prydoxConfig.wrappedTokenGateway as `0x${string}`,
          abi: wrappedTokenGatewayAbi,
          functionName: "getWETHAddress",
        }),
      ]);

      // Deposits via gateway.depositETH() land in the WETH reserve (gatewayWeth),
      // NOT necessarily in prydoxConfig.tokens.ZKLT — resolve dynamically.
      const zkltcAddress = gatewayWeth as `0x${string}`;

      const [usdcRow, ltcRow, zkltcRow, usdcReserveCfg, ltcReserveCfg, zkltcReserveCfg, accountTuple] =
        await Promise.all([
          client.readContract({
            address: prydoxConfig.poolDataProvider as `0x${string}`,
            abi: poolDataProviderAbi,
            functionName: "getUserReserveData",
            args: [usdcMeta.address, address],
          }),
          client.readContract({
            address: prydoxConfig.poolDataProvider as `0x${string}`,
            abi: poolDataProviderAbi,
            functionName: "getUserReserveData",
            args: [ltcMeta.address, address],
          }),
          client.readContract({
            address: prydoxConfig.poolDataProvider as `0x${string}`,
            abi: poolDataProviderAbi,
            functionName: "getUserReserveData",
            args: [zkltcAddress, address],
          }),
          client.readContract({
            address: prydoxConfig.poolDataProvider as `0x${string}`,
            abi: poolDataProviderAbi,
            functionName: "getReserveConfigurationData",
            args: [usdcMeta.address],
          }),
          client.readContract({
            address: prydoxConfig.poolDataProvider as `0x${string}`,
            abi: poolDataProviderAbi,
            functionName: "getReserveConfigurationData",
            args: [ltcMeta.address],
          }),
          client.readContract({
            address: prydoxConfig.poolDataProvider as `0x${string}`,
            abi: poolDataProviderAbi,
            functionName: "getReserveConfigurationData",
            args: [zkltcAddress],
          }),
          client
            .readContract({
              address: prydoxConfig.pool as `0x${string}`,
              abi: poolAbi,
              functionName: "getUserAccountData",
              args: [address],
            })
            .catch((): null => null),
        ]);

      const maxLtvAsCollateral = {
        USDC: fmtReserveLtvBps(usdcReserveCfg[1]),
        LTC: fmtReserveLtvBps(ltcReserveCfg[1]),
        ZKLTC: fmtReserveLtvBps(zkltcReserveCfg[1]),
      } as const;

      function mapReserve(
        symbol: "USDC" | "LTC" | "ZKLTC",
        row: readonly [
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint | number,
          boolean,
        ],
        decimals: number,
      ): UserReserveSnapshot {
        const suppliedWei = row[0];
        const stableWei = row[1];
        const varWei = row[2];
        return {
          symbol,
          supplied: fmtAmt(suppliedWei, decimals),
          suppliedWei,
          variableDebt: fmtAmt(varWei, decimals),
          variableDebtWei: varWei,
          stableDebt: fmtAmt(stableWei, decimals),
          stableDebtWei: stableWei,
          usageAsCollateral: row[8],
        };
      }

      const usdc = mapReserve("USDC", usdcRow, usdcMeta.decimals);
      const ltc = mapReserve("LTC", ltcRow, ltcMeta.decimals);
      const zkltc = mapReserve("ZKLTC", zkltcRow, 18);

      let account: UserAccountSnapshot | null = null;
      if (accountTuple) {
        const [
          totalCollateralBase,
          totalDebtBase,
          availableBorrowsBase,
          liquidationThresholdBps,
          ltvBps,
          healthFactor,
        ] = accountTuple;
        account = {
          totalCollateralUsd: fmtUsdBase(totalCollateralBase),
          totalDebtUsd: fmtUsdBase(totalDebtBase),
          availableBorrowsUsd: fmtUsdBase(availableBorrowsBase),
          healthFactor: fmtHealthFactor(healthFactor, totalDebtBase),
          weightedLtv: fmtLtvRatio(ltvBps),
          liquidationThreshold: fmtLtvRatio(liquidationThresholdBps),
        };
      }

      return { usdc, ltc, zkltc, account, maxLtvAsCollateral };
    },
    enabled,
    retry: 1,
    retryDelay: 1200,
    staleTime: 5_000,
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
  });

  const data = query.data;
  const hasActivePosition = data ? hasPosition(data) : false;

  return {
    data,
    hasActivePosition,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
