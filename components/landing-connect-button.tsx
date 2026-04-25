"use client";

import Link from "next/link";
import { useWalletConnectActions } from "@/hooks/use-wallet-connect-actions";

const heroClass =
  "inline-flex min-w-[200px] items-center justify-center rounded-[9px] bg-[var(--accent)] px-8 py-3.5 text-[15px] font-bold text-white transition-[transform,background] hover:bg-[var(--accent-bright)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const ctaClass =
  "inline-flex min-w-[200px] items-center justify-center rounded-[9px] bg-[var(--accent)] px-8 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--accent-bright)] disabled:cursor-not-allowed disabled:opacity-60";

/** Primary landing CTA: connect, switch, or open app when already on LitVM. */
export function LandingConnectPrimary({ variant }: { variant: "hero" | "cta" }) {
  const {
    mounted,
    address,
    wrongChain,
    busy,
    connectWallet,
    switchToLitvm,
    disconnectedLabel,
  } = useWalletConnectActions();

  const cls = variant === "hero" ? heroClass : ctaClass;

  if (!mounted) {
    return (
      <button type="button" disabled className={cls}>
        Connect wallet
      </button>
    );
  }

  if (address && wrongChain) {
    return (
      <button type="button" onClick={switchToLitvm} disabled={busy} className={cls}>
        Switch network
      </button>
    );
  }

  if (address && !wrongChain) {
    return (
      <Link href="/lend" className={cls}>
        Open app
      </Link>
    );
  }

  return (
    <button type="button" onClick={connectWallet} disabled={busy} className={cls}>
      {disconnectedLabel}
    </button>
  );
}
