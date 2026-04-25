"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicClient } from "viem";
import { formatUnits } from "viem";
import { useAccount, useChainId, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { erc20Abi } from "@/lib/abi/erc20";
import { litvmLiteforge } from "@/lib/chain";
import { fetchReserveMap } from "@/lib/reserve-helpers";

export type WalletBalances = {
  usdc: string;
  ltc: string;
  native: string;
  /** Native chain currency (wei) — same asset used for `depositETH` value + gas. */
  nativeWei: bigint;
};

function formatAmount(raw: bigint, decimals: number) {
  const n = Number(formatUnits(raw, decimals));
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

async function readErc20(
  client: PublicClient,
  token: `0x${string}`,
  account: `0x${string}`,
): Promise<{ raw: bigint; decimals: number } | null> {
  try {
    const [decimals, raw] = await Promise.all([
      client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      }),
    ]);
    return { raw, decimals: Number(decimals) };
  } catch {
    return null;
  }
}

/**
 * Reads **LitVM (4441)** balances for the connected address — even if the wallet extension is
 * still on another chain (we query the LitVM RPC directly).
 *
 * USDC/LTC: tries `NEXT_PUBLIC_TOKEN_*` first; if balance is 0 and the pool lists a different
 * underlying, reads that too so the UI matches where funds often sit.
 */
export function useWalletBalances() {
  const config = useConfig();
  const { address, status } = useAccount();
  const chainId = useChainId();
  const connected = status === "connected" && Boolean(address);
  /** Fetch LitVM balances whenever a wallet is connected — do not require the wallet to be switched to 4441. */
  const enabled = connected;

  return useQuery({
    queryKey: [
      "wallet-balances",
      address,
      chainId,
      prydoxConfig.tokens.USDC,
      prydoxConfig.tokens.LTC,
      "litvm+reserve-fallback",
    ],
    queryFn: async (): Promise<WalletBalances> => {
      if (!address) {
        throw new Error("No account");
      }
      const account = address as `0x${string}`;

      const pc = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!pc) {
        throw new Error("No RPC client");
      }
      const client = pc as PublicClient;

      const cfgUsdc = prydoxConfig.tokens.USDC as `0x${string}`;
      const cfgLtc = prydoxConfig.tokens.LTC as `0x${string}`;

      const nativeRaw = await client.getBalance({ address: account });

      const reserves = await fetchReserveMap(client);

      async function pickBalance(
        symbol: "USDC" | "LTC",
        configToken: `0x${string}`,
      ): Promise<string> {
        let best = await readErc20(client, configToken, account);
        if (best && best.raw > BigInt(0)) {
          return formatAmount(best.raw, best.decimals);
        }
        const alt =
          symbol === "USDC" ? reserves?.USDC.address : reserves?.LTC.address;
        if (alt && alt.toLowerCase() !== configToken.toLowerCase()) {
          const altToken = alt as `0x${string}`;
          const second = await readErc20(client, altToken, account);
          if (second && second.raw > BigInt(0)) {
            return formatAmount(second.raw, second.decimals);
          }
        }
        if (best) return formatAmount(best.raw, best.decimals);
        return "0";
      }

      const [usdc, ltc] = await Promise.all([
        pickBalance("USDC", cfgUsdc),
        pickBalance("LTC", cfgLtc),
      ]);

      return {
        usdc,
        ltc,
        native: formatAmount(nativeRaw, 18),
        nativeWei: nativeRaw,
      };
    },
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
        ? 5_000
        : false,
  });
}
