import type { PublicClient } from "viem";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { poolDataProviderAbi } from "@/lib/abi/pool-data-provider";
import { isAllowedReserveSymbol } from "@/lib/reserves";

export type ReserveUnderlying = {
  address: `0x${string}`;
  decimals: number;
};

export type ReserveMap = {
  USDC: ReserveUnderlying;
  LTC: ReserveUnderlying;
};

/**
 * Resolve USDC/LTC underlying addresses from the live pool (not static env defaults).
 */
export async function fetchReserveMap(
  client: PublicClient,
): Promise<ReserveMap | null> {
  const tokens = await client.readContract({
    address: prydoxConfig.poolDataProvider as `0x${string}`,
    abi: poolDataProviderAbi,
    functionName: "getAllReservesTokens",
  });

  const found: Partial<Record<"USDC" | "LTC", `0x${string}`>> = {};
  for (const t of tokens) {
    const sym = t.symbol.trim().toUpperCase();
    if (!isAllowedReserveSymbol(sym)) continue;
    if (sym === "USDC" || sym === "LTC") {
      found[sym] = t.tokenAddress as `0x${string}`;
    }
  }
  if (!found.USDC || !found.LTC) return null;

  const [usdcCfg, ltcCfg] = await Promise.all([
    client.readContract({
      address: prydoxConfig.poolDataProvider as `0x${string}`,
      abi: poolDataProviderAbi,
      functionName: "getReserveConfigurationData",
      args: [found.USDC],
    }),
    client.readContract({
      address: prydoxConfig.poolDataProvider as `0x${string}`,
      abi: poolDataProviderAbi,
      functionName: "getReserveConfigurationData",
      args: [found.LTC],
    }),
  ]);

  return {
    USDC: {
      address: found.USDC,
      decimals: Number(usdcCfg[0]),
    },
    LTC: {
      address: found.LTC,
      decimals: Number(ltcCfg[0]),
    },
  };
}
