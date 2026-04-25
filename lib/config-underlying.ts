import type { PublicClient } from "viem";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { erc20Abi } from "@/lib/abi/erc20";

/** USDC/LTC underlying used everywhere: wallet balance, approve, supply, withdraw, debt, etc. */
export type ConfigUnderlying = {
  address: `0x${string}`;
  decimals: number;
};

/**
 * Resolve `prydoxConfig.tokens` on-chain (decimals). Pool calls use these same addresses — set
 * `NEXT_PUBLIC_TOKEN_USDC` / `NEXT_PUBLIC_TOKEN_LTC` to your deployment’s reserve underlyings.
 */
export async function getUnderlyingMeta(
  client: PublicClient,
  asset: "USDC" | "LTC",
): Promise<ConfigUnderlying> {
  const address = (
    asset === "USDC" ? prydoxConfig.tokens.USDC : prydoxConfig.tokens.LTC
  ) as `0x${string}`;
  const decimals = await client.readContract({
    address,
    abi: erc20Abi,
    functionName: "decimals",
  });
  return { address, decimals: Number(decimals) };
}

export async function getUsdcUnderlying(
  client: PublicClient,
): Promise<ConfigUnderlying> {
  return getUnderlyingMeta(client, "USDC");
}
