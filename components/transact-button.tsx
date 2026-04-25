"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useLitvmSession } from "@/hooks/use-litvm-session";

type Variant = "primary" | "secondary" | "outline";

const styles: Record<
  Variant,
  string
> = {
  primary:
    "border border-[#1d7f50] bg-[#0f9a5f] text-white shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25)] hover:bg-[#12ad6b]",
  secondary:
    "border border-[#047857] bg-[#059669] text-white hover:opacity-95",
  outline:
    "border border-[var(--border)] bg-[#1a1f2e] text-[var(--fg)] hover:bg-[var(--surface-hover)]",
};

export function TransactButton({
  label,
  variant = "primary",
  className = "",
  disabled: propDisabled,
  children,
  ...rest
}: {
  label: string;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const { mounted, ready, wrongChain, busy, connectWallet, switchToLitvm } =
    useLitvmSession();
  const base =
    "inline-flex w-full items-center justify-center rounded-[10px] px-4 py-3 text-[14px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50";
  const v = styles[variant];

  if (!ready) {
    if (wrongChain) {
      return (
        <button
          type="button"
          disabled={!mounted || busy}
          onClick={() => switchToLitvm()}
          className={`${base} ${v} ${className}`}
        >
          Switch network
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled={!mounted || busy}
        onClick={() => connectWallet()}
        className={`${base} ${v} ${className}`}
      >
        {!mounted || busy ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={propDisabled ?? false}
      className={`${base} ${v} ${className}`}
      {...rest}
    >
      {children ?? label}
    </button>
  );
}
