"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowsClockwise,
  ArrowsLeftRight,
  Coins,
  House,
  Lightning,
  MagnifyingGlass,
  ChartLineUp,
  Target,
} from "@phosphor-icons/react";
import { ConnectWallet } from "@/components/connect-wallet";
import { ProtocolSidebar } from "@/components/protocol-sidebar";

/** Same routes as the desktop sidebar “Markets” + Activities groups (sidebar is hidden below md). */
const MOBILE_PROTOCOL_TABS = [
  { href: "/markets", label: "Markets", icon: ChartLineUp },
  { href: "/positions", label: "Positions", icon: Target },
  { href: "/borrow", label: "Borrow", icon: Coins },
  { href: "/lend", label: "Lend", icon: ArrowsLeftRight },
  { href: "/flash", label: "Flash", icon: Lightning },
  { href: "/activities", label: "Activity", icon: House },
] as const;

function ProtocolMobileNavTabs() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Protocol pages"
      className="border-b border-white/10 bg-[#080909]/98 px-4 py-2 md:hidden"
    >
      <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {MOBILE_PROTOCOL_TABS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                active
                  ? "border-[#1e7a4f] bg-[rgba(15,154,95,0.2)] text-[#c7f3dd]"
                  : "border-white/10 bg-[#151617] text-[#bcc1c8] hover:border-white/20 hover:text-white"
              }`}
            >
              <Icon size={14} weight={active ? "fill" : "regular"} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ProtocolAppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const [faucetOpen, setFaucetOpen] = useState(false);
  const faucetRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const showMarketsSearch = pathname === "/markets";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!faucetRef.current) return;
      if (!faucetRef.current.contains(e.target as Node)) setFaucetOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="min-h-screen bg-[#080909] text-[var(--fg)]">
      <div className="mx-auto flex max-w-[1540px]">
        <div className="sticky top-0 h-screen">
          <ProtocolSidebar />
        </div>
        <div className="min-w-0 flex-1">
          <div className="pointer-events-none fixed inset-x-0 bottom-0 h-[35vh] bg-[radial-gradient(90%_80%_at_50%_100%,rgba(90,90,90,0.12),transparent)]" />
          <header className="z-40 bg-[#080909]/95 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:h-16 md:px-6">
              <div className="flex min-w-0 items-center gap-2">
                {showMarketsSearch ? (
                  <Link
                    href="/"
                    className="mr-1 flex shrink-0 items-center gap-0 transition-opacity hover:opacity-90 md:hidden"
                    aria-label="Prydox home"
                  >
                    <Image
                      src="/logo/prydox-logo.png"
                      alt=""
                      width={34}
                      height={34}
                      className="h-8 w-8 rounded-[7px] object-cover object-left"
                    />
                    <span className="-ml-1.5 text-[16px] font-semibold tracking-tight text-[#f1f2f4]">
                      rydox
                    </span>
                  </Link>
                ) : null}
                {showMarketsSearch ? (
                  <label className="relative hidden md:block">
                    <MagnifyingGlass
                      size={15}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9fa3a8]"
                    />
                    <input
                      type="text"
                      placeholder="Search asset"
                      className="h-9 w-80 rounded-full border border-white/10 bg-[#151617] pl-8 pr-3 text-[12px] text-[#e6e8ea] outline-none placeholder:text-[#8a8f96] focus:border-[#666a70]"
                    />
                  </label>
                ) : null}
                <a
                  href="https://www.addax.finance/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-[13px] font-medium text-[#bcc1c8] transition-colors hover:text-white"
                >
                  <ArrowsClockwise size={14} className="animate-[spin_3.5s_linear_infinite]" />
                  Swap
                </a>
                <div className="relative" ref={faucetRef}>
                  <button
                    type="button"
                    onClick={() => setFaucetOpen((v) => !v)}
                    className="px-2 py-1 text-[13px] font-medium text-[#bcc1c8] transition-colors hover:text-white"
                  >
                    Faucet
                  </button>
                  {faucetOpen ? (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[170px] rounded-[10px] border border-[var(--border)] bg-[#131416] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                      <a
                        href="https://liteforge.hub.caldera.xyz/"
                        className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-[12px] text-[var(--fg)] transition-colors hover:bg-[var(--surface2)]"
                      >
                        <Image src="/zkltc.png" alt="zkLTC" width={16} height={16} className="rounded-full" />
                        zkLTC
                      </a>
                      <a
                        href="https://www.midashand.xyz/"
                        className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-[12px] text-[var(--fg)] transition-colors hover:bg-[var(--surface2)]"
                      >
                        <Image src="/usdc.png" alt="USDC" width={16} height={16} className="rounded-full" />
                        USDC
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ConnectWallet variant="greenText" />
              </div>
            </div>
          </header>

          <ProtocolMobileNavTabs />

          <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
            <section>
              <div className="mb-5">
                <h1 className="text-[28px] font-semibold leading-tight text-[#f1f6f2]">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-1 text-[13px] text-[#93a596]">{subtitle}</p>
                ) : null}
              </div>
              {children}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

