"use client";

import { useEffect, useState } from "react";
import { useLitvmSession } from "@/hooks/use-litvm-session";

/**
 * Defer wallet hooks until after mount so wagmi `Hydrate` never triggers
 * updates in this tree during its render (React 19 / RainbowKit).
 */
export function WalletPromptBanner() {
  const [client, setClient] = useState(false);
  useEffect(() => {
    setClient(true);
  }, []);

  if (!client) return null;

  return <WalletPromptBannerInner />;
}

function WalletPromptBannerInner() {
  const { mounted, ready, wrongChain, busy, connectWallet, switchToLitvm } =
    useLitvmSession();

  if (ready) return null;

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-[13px] leading-snug text-[var(--muted)]">
        {wrongChain
          ? "Switch to the LitVM network to view balances and submit transactions."
          : "Connect your wallet to supply, borrow, repay, and manage positions."}
      </p>
      <div className="flex shrink-0 gap-2">
        {wrongChain ? (
          <button
            type="button"
            disabled={!mounted || busy}
            onClick={() => switchToLitvm()}
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-[var(--accent-fg)] disabled:opacity-50"
          >
            Switch network
          </button>
        ) : (
          <button
            type="button"
            disabled={!mounted || busy}
            onClick={() => connectWallet()}
            className="rounded-[8px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-[var(--accent-fg)] disabled:opacity-50"
          >
            {!mounted || busy ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </div>
  );
}
