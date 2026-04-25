"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { liquidityRateToSupplyApyPct } from "@/lib/aave-math";
import { variableBorrowRateToApyPct } from "@/lib/aave-math";
import { chainlinkFeedAbi } from "@/lib/abi/chainlink-feed";
import { poolDataProviderAbi } from "@/lib/abi/pool-data-provider";
import { litvmLiteforge } from "@/lib/chain";
import { isAllowedReserveSymbol } from "@/lib/reserves";

export type ReserveRow = {
  symbol: string;
  asset: `0x${string}`;
  decimals: number;
  /** Total supplied liquidity (aToken supply, underlying units). */
  totalSupplied: string;
  /** Total borrowed: variable + stable (underlying units). */
  totalBorrowedVar: string;
  /** Total borrowed / total supplied in percent. */
  utilizationPct: number;
  active: boolean;
  /** Supply-side APY from reserve `liquidityRate` (ray/sec). */
  supplyApyPct: number;
  /** Gross supply APY before protocol reserve factor. */
  grossSupplyApyPct: number;
  /** Borrow-side variable APY from reserve `variableBorrowRate` (ray/sec). */
  variableBorrowApyPct: number;
  /** Protocol share of lender interest (e.g. 20 means 20%). */
  protocolTakePct: number;
  /** Oracle USD price used for valuation on this row. */
  usdPrice: number;
  /** Supplied value in USD (totalSupplied * usdPrice). */
  totalSuppliedUsd: number;
  /** Borrowed value in USD (totalBorrowed * usdPrice). */
  totalBorrowedUsd: number;
};

export type PoolMarketPayload = {
  reserves: ReserveRow[];
  /** USDC + LTC supplied value at oracle prices (feeds). */
  tvlUsd: number;
};

async function readFeedUsd(
  client: NonNullable<ReturnType<typeof getPublicClient>>,
  feed: `0x${string}`,
): Promise<number> {
  const [dec, round] = await Promise.all([
    client.readContract({
      address: feed,
      abi: chainlinkFeedAbi,
      functionName: "decimals",
    }),
    client.readContract({
      address: feed,
      abi: chainlinkFeedAbi,
      functionName: "latestRoundData",
    }),
  ]);
  let ans = round[1];
  if (ans < BigInt(0)) ans = -ans;
  return Number(formatUnits(ans, dec));
}

export function usePoolReserves() {
  const config = useConfig();
  const PROTOCOL_INTEREST_TAKE_PCT = 20;
  const LENDER_SHARE = 1 - PROTOCOL_INTEREST_TAKE_PCT / 100;

  const query = useQuery({
    queryKey: [
      "pool-reserves",
      prydoxConfig.poolDataProvider,
      "market",
      litvmLiteforge.id,
    ],
    queryFn: async (): Promise<PoolMarketPayload> => {
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) {
        return { reserves: [], tvlUsd: 0 };
      }

      const [usdcUsd, ltcUsd, tokens] = await Promise.all([
        readFeedUsd(client, prydoxConfig.feeds.USDC as `0x${string}`),
        readFeedUsd(client, prydoxConfig.feeds.LTC as `0x${string}`),
        client.readContract({
          address: prydoxConfig.poolDataProvider as `0x${string}`,
          abi: poolDataProviderAbi,
          functionName: "getAllReservesTokens",
        }),
      ]);

      const bySymbol = new Map<string, ReserveRow>();

      for (const t of tokens) {
        if (!isAllowedReserveSymbol(t.symbol)) continue;
        const rawSymbol = t.symbol.toUpperCase();
        const normalizedSymbol = rawSymbol === "WETH" ? "ZKLTC" : rawSymbol;

        const dec = await client.readContract({
          address: prydoxConfig.poolDataProvider as `0x${string}`,
          abi: poolDataProviderAbi,
          functionName: "getReserveConfigurationData",
          args: [t.tokenAddress as `0x${string}`],
        });
        const decimals = Number(dec[0]);

        const rd = await client.readContract({
          address: prydoxConfig.poolDataProvider as `0x${string}`,
          abi: poolDataProviderAbi,
          functionName: "getReserveData",
          args: [t.tokenAddress as `0x${string}`],
        });

        const isActive = dec[8];
        const liquidityRate = rd[5];
        const variableBorrowRate = rd[6];
        const grossSupplyApyPct = liquidityRateToSupplyApyPct(liquidityRate);
        const supplyApyPct = grossSupplyApyPct * LENDER_SHARE;
        const variableBorrowApyPct =
          variableBorrowRateToApyPct(variableBorrowRate);

        const totalStableDebt = rd[3];
        const totalVariableDebt = rd[4];
        const totalBorrowedWei = totalStableDebt + totalVariableDebt;
        const totalSupplied = Number(formatUnits(rd[2], decimals));
        const totalBorrowed = Number(formatUnits(totalBorrowedWei, decimals));
        const usdPrice =
          normalizedSymbol === "USDC"
            ? usdcUsd
            : normalizedSymbol === "LTC" || normalizedSymbol === "ZKLTC"
              ? ltcUsd
              : 0;
        const totalSuppliedUsd =
          Number.isFinite(totalSupplied) && Number.isFinite(usdPrice)
            ? totalSupplied * usdPrice
            : 0;
        const totalBorrowedUsd =
          Number.isFinite(totalBorrowed) && Number.isFinite(usdPrice)
            ? totalBorrowed * usdPrice
            : 0;
        const utilizationPct =
          Number.isFinite(totalSupplied) && totalSupplied > 0 && Number.isFinite(totalBorrowed)
            ? Math.min(100, Math.max(0, (totalBorrowed / totalSupplied) * 100))
            : 0;

        const nextRow: ReserveRow = {
          symbol: normalizedSymbol,
          asset: t.tokenAddress as `0x${string}`,
          decimals,
          totalSupplied: formatUnits(rd[2], decimals),
          totalBorrowedVar: formatUnits(totalBorrowedWei, decimals),
          utilizationPct,
          active: Boolean(isActive),
          supplyApyPct,
          grossSupplyApyPct,
          variableBorrowApyPct,
          protocolTakePct: PROTOCOL_INTEREST_TAKE_PCT,
          usdPrice,
          totalSuppliedUsd,
          totalBorrowedUsd,
        };

        const prev = bySymbol.get(normalizedSymbol);
        if (!prev) {
          bySymbol.set(normalizedSymbol, nextRow);
          continue;
        }

        const prevAmt = Number(prev.totalSupplied) + Number(prev.totalBorrowedVar);
        const nextAmt =
          Number(nextRow.totalSupplied) + Number(nextRow.totalBorrowedVar);
        const prevActive = prev.active;
        const nextActive = nextRow.active;

        const pickNext =
          (nextActive && !prevActive) ||
          (nextActive === prevActive && nextAmt > prevAmt);
        if (pickNext) bySymbol.set(normalizedSymbol, nextRow);
      }

      const rows = [...bySymbol.values()];
      rows.sort((a, b) => a.symbol.localeCompare(b.symbol));

      let tvlUsd = 0;
      for (const r of rows) {
        const sym = r.symbol.toUpperCase();
        const amt = Number(r.totalSupplied);
        if (!Number.isFinite(amt)) continue;
        if (sym === "USDC") tvlUsd += amt * usdcUsd;
        if (sym === "LTC" || sym === "ZKLTC") tvlUsd += amt * ltcUsd;
      }
      if (!Number.isFinite(tvlUsd) || tvlUsd < 0) tvlUsd = 0;

      return { reserves: rows, tvlUsd };
    },
    /** Updated by websocket block listener; keep gentle interval as fallback. */
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    data: query.data?.reserves,
    tvlUsd: query.data?.tvlUsd,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
