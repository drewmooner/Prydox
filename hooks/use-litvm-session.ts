"use client";

import { useAccount } from "wagmi";
import { litvmLiteforge } from "@/lib/chain";
import { useWalletConnectActions } from "@/hooks/use-wallet-connect-actions";

export function useLitvmSession() {
  const { address, chainId, status } = useAccount();
  const {
    mounted,
    busy,
    connectWallet,
    switchToLitvm,
  } = useWalletConnectActions();

  const wrongChain = Boolean(address && chainId !== litvmLiteforge.id);
  const ready = Boolean(mounted && address && !wrongChain);

  return {
    mounted,
    address,
    chainId,
    status,
    ready,
    wrongChain,
    busy,
    connectWallet,
    switchToLitvm,
  };
}
