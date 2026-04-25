"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectWallet({
  variant = "default",
}: {
  variant?: "default" | "greenText";
}) {
  if (variant === "greenText") {
    return (
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;
          if (!connected) {
            return (
              <button
                type="button"
                onClick={openConnectModal}
                className="rounded-[12px] border border-[#1d7f50] bg-[#0f9a5f] px-4 py-2 text-[13px] font-semibold text-white shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25)] transition-colors hover:bg-[#12ad6b]"
              >
                Connect Wallet
              </button>
            );
          }
          return (
            <button
              type="button"
              onClick={openAccountModal}
              className="rounded-[12px] border border-[#1d7f50] bg-[#0f9a5f] px-4 py-2 text-[13px] font-semibold text-white shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25)] transition-colors hover:bg-[#12ad6b]"
              title={chain?.name}
            >
              {account.displayName}
            </button>
          );
        }}
      </ConnectButton.Custom>
    );
  }
  return <ConnectButton showBalance={false} chainStatus="name" />;
}
