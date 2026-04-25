"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { prydoxConfig } from "@/app/lib/prydox-config";

const protocol = [
  { href: "/lend", label: "Lend" },
  { href: "/borrow", label: "Borrow" },
  { href: "/flash", label: "Flash loans" },
  { href: "/#markets", label: "Markets" },
] as const;

const resources = [
  { href: prydoxConfig.docsUrl, label: "Documentation", external: true as boolean },
  { href: prydoxConfig.explorer, label: "Block explorer", external: true as boolean },
  { href: "/#contracts", label: "Contracts", external: false as boolean },
] as const;

const LITEFORGE_FAUCET = "https://liteforge.hub.caldera.xyz/";

export function SiteFooter() {
  const pathname = usePathname();
  const showOnlyOnLanding = pathname === "/";
  if (!showOnlyOnLanding) return null;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-[1160px] px-6 py-14 md:px-12 lg:px-[48px]">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-0.5">
              <Image
                src="/logo/prydox-logo.png"
                alt="Prydox"
                width={36}
                height={36}
                className="h-9 w-9 rounded-[8px] object-cover object-left"
              />
              <span className="-ml-2.5 font-display text-[17px] font-bold tracking-normal text-[var(--fg)]">
                rydox
              </span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-[var(--muted)]">
              Non-custodial lending on LitVM. Supply USDC, borrow against zkLTC,
              or use atomic flash liquidity — entirely on-chain.
            </p>
            <p className="mt-5 font-mono-tight text-[11px] text-[var(--muted-2)]">
              {prydoxConfig.name} · Chain ID {prydoxConfig.chainId}
            </p>
          </div>

          <div>
            <p className="font-mono-tight text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted-2)]">
              Protocol
            </p>
            <ul className="mt-4 space-y-3">
              {protocol.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[14px] text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono-tight text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted-2)]">
              Resources
            </p>
            <ul className="mt-4 space-y-3">
              {resources.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    {...(item.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-[14px] text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
                  >
                    {item.label}
                    {item.external ? (
                      <span className="ml-0.5 text-[11px] text-[var(--muted-2)]">
                        ↗
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono-tight text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted-2)]">
              Faucet
            </p>
            <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-[var(--muted)]">
              Get zkLTC from the Liteforge Hub faucet — you&apos;ll need native
              zkLTC to pay gas on LitVM.
            </p>
            <a
              href={LITEFORGE_FAUCET}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-[14px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
            >
              liteforge.hub.caldera.xyz
              <span className="ml-0.5 text-[11px] text-[var(--muted-2)]">↗</span>
            </a>
          </div>
        </div>

        <div className="mt-14 border-t border-[var(--border)] pt-8">
          <p className="text-center text-[11px] leading-[1.75] text-[var(--muted-2)] md:text-left">
            This interface is provided for convenience only. Smart contracts
            carry risk of loss, including from liquidation, oracle failure, or
            smart contract bugs. Nothing here is financial, legal, or tax
            advice. Verify transactions and addresses on the explorer before
            signing.
          </p>
          <p className="mt-6 text-center font-mono-tight text-[11px] text-[var(--muted-2)] md:text-left">
            © {new Date().getFullYear()} Prydox. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
