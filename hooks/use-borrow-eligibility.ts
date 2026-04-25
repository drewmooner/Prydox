"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { chainlinkFeedAbi } from "@/lib/abi/chainlink-feed";
import { litvmLiteforge } from "@/lib/chain";

type BorrowEligibility = {
  maxBorrowUsdc: string;
  ltcUsd: number;
  usdcUsd: number;
  ltvBps: number;
};

const DEFAULT_LTV_BPS = Number(process.env.NEXT_PUBLIC_BORROW_LTV_BPS ?? 7000);

function parseAmount(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatOut(v: number) {
  if (!Number.isFinite(v) || v <= 0) return "0.00";
  return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function useBorrowEligibility(collateralAmount: string) {
  const { chainId, isConnected } = useAccount();
  const client = usePublicClient({ chainId: litvmLiteforge.id });
  const onLitvm = chainId === litvmLiteforge.id;
  const collateral = parseAmount(collateralAmount);

  return useQuery({
    queryKey: ["borrow-eligibility", chainId, collateralAmount],
    queryFn: async (): Promise<BorrowEligibility> => {
      if (!client || collateral <= 0) {
        return {
          maxBorrowUsdc: "0.00",
          ltcUsd: 0,
          usdcUsd: 0,
          ltvBps: DEFAULT_LTV_BPS,
        };
      }

      const [ltcDecimals, ltcRound, usdcDecimals, usdcRound] = await Promise.all([
        client.readContract({
          address: prydoxConfig.feeds.LTC as `0x${string}`,
          abi: chainlinkFeedAbi,
          functionName: "decimals",
        }),
        client.readContract({
          address: prydoxConfig.feeds.LTC as `0x${string}`,
          abi: chainlinkFeedAbi,
          functionName: "latestRoundData",
        }),
        client.readContract({
          address: prydoxConfig.feeds.USDC as `0x${string}`,
          abi: chainlinkFeedAbi,
          functionName: "decimals",
        }),
        client.readContract({
          address: prydoxConfig.feeds.USDC as `0x${string}`,
          abi: chainlinkFeedAbi,
          functionName: "latestRoundData",
        }),
      ]);

      const ltcUsd = Number(
        formatUnits(
          ltcRound[1] > BigInt(0) ? ltcRound[1] : BigInt(0),
          ltcDecimals,
        ),
      );
      const usdcUsd = Number(
        formatUnits(
          usdcRound[1] > BigInt(0) ? usdcRound[1] : BigInt(0),
          usdcDecimals,
        ),
      );

      const collateralUsd = collateral * ltcUsd;
      const maxBorrowUsdcRaw =
        usdcUsd > 0 ? (collateralUsd * (DEFAULT_LTV_BPS / 10_000)) / usdcUsd : 0;

      return {
        maxBorrowUsdc: formatOut(maxBorrowUsdcRaw),
        ltcUsd,
        usdcUsd,
        ltvBps: DEFAULT_LTV_BPS,
      };
    },
    enabled: Boolean(isConnected && onLitvm && client && collateral >= 0),
    staleTime: 10_000,
    refetchInterval: 5_000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}
