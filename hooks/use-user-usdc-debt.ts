"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useAccount, useChainId, useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { poolDataProviderAbi } from "@/lib/abi/pool-data-provider";
import { getUsdcUnderlying } from "@/lib/config-underlying";
import { litvmLiteforge } from "@/lib/chain";

/** Variable debt in USDC (human-readable). */
export function useUserUsdcDebt() {
  const config = useConfig();
  const { address, status } = useAccount();
  const chainId = useChainId();
  const onLitvm = chainId === litvmLiteforge.id;
  const enabled =
    status === "connected" && Boolean(address) && onLitvm;

  return useQuery({
    queryKey: ["user-usdc-reserve", address, chainId],
    queryFn: async () => {
      if (!address) return "0";
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) return "0";
      const usdc = await getUsdcUnderlying(client);

      const data = await client.readContract({
        address: prydoxConfig.poolDataProvider as `0x${string}`,
        abi: poolDataProviderAbi,
        functionName: "getUserReserveData",
        args: [usdc.address, address],
      });

      const varDebt = data[2];
      return formatUnits(varDebt, usdc.decimals);
    },
    enabled,
    staleTime: 5_000,
    refetchInterval: 20_000,
  });
}
