"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { litvmLiteforge } from "@/lib/chain";

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Shared connect / switch / disconnect logic. Mount gate avoids SSR/client
 * wagmi state mismatch (hydration errors).
 */
export function useWalletConnectActions() {
  const [mounted, setMounted] = useState(false);
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, chainId, status } = useAccount();
  const { disconnect, isPending: disconnectPending } = useDisconnect();
  const { switchChain, isPending: switchPending } = useSwitchChain();

  const wrongChain = Boolean(address && chainId !== litvmLiteforge.id);
  const busy = disconnectPending || switchPending || status === "connecting";

  const connectWallet = useCallback(() => {
    if (!mounted || busy) return;
    openConnectModal?.();
  }, [mounted, busy, openConnectModal]);

  const switchToLitvm = useCallback(() => {
    if (!mounted || busy) return;
    switchChain({ chainId: litvmLiteforge.id });
  }, [mounted, busy, switchChain]);

  const disconnectedLabel =
    mounted && status === "connecting"
      ? "Connecting…"
      : "Connect wallet";

  return {
    mounted,
    address,
    wrongChain,
    busy,
    status,
    connectWallet,
    switchToLitvm,
    disconnect,
    shorten,
    disconnectedLabel,
  };
}
