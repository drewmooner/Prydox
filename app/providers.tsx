"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { type ReactNode, useState } from "react";
import { useWatchBlockNumber, WagmiProvider } from "wagmi";
import { litvmLiteforge } from "@/lib/chain";
import { wagmiConfig } from "@/lib/wagmi-config";

function BlockSyncBridge() {
  const queryClient = useQueryClient();
  useWatchBlockNumber({
    chainId: litvmLiteforge.id,
    emitOnBegin: false,
    onBlockNumber: () => {
      void queryClient.invalidateQueries({ queryKey: ["pool-reserves"] });
      void queryClient.invalidateQueries({ queryKey: ["borrow-eligibility"] });
      void queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      void queryClient.invalidateQueries({ queryKey: ["user-usdc-reserve"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-balances"] });
    },
  });
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BlockSyncBridge />
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
