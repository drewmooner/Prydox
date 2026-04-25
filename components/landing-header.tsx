"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function LandingHeader() {
  const pathname = usePathname();
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [faucetOpen, setFaucetOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faucetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY <= 0;
      setIsAtTop(top);
      setIsScrolling(true);
      if (stopTimer.current) clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => setIsScrolling(false), 140);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!faucetRef.current) return;
      if (!faucetRef.current.contains(e.target as Node)) setFaucetOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setFaucetOpen(false);
  }, [pathname]);

  return (
    <header
      className={`z-30 bg-[#080909]/95 backdrop-blur-xl transition-colors ${
        isScrolling && !isAtTop ? "border-b border-white/10" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-3 md:px-10">
        <Link href="/" className="flex items-center gap-0.5">
          <Image
            src="/logo/prydox-logo.png"
            alt="Prydox logo"
            width={34}
            height={34}
            className="h-8 w-8 rounded-[7px] object-cover object-left"
          />
          <span className="-ml-2 text-[18px] font-bold tracking-tight text-[#dfffea]">
            rydox
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-[14px] text-[#cce2d8] md:flex">
          <Link
            href="/products"
            className={`rounded-[8px] px-2 py-1 transition-colors ${
              pathname?.startsWith("/products")
                ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                : "hover:text-white"
            }`}
          >
            Products
          </Link>
          <Link
            href="/developer"
            className={`rounded-[8px] px-2 py-1 transition-colors ${
              pathname?.startsWith("/developer") || pathname?.startsWith("/developers")
                ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                : "hover:text-white"
            }`}
          >
            Developer
          </Link>
          <Link
            href="/docs"
            className={`rounded-[8px] px-2 py-1 transition-colors ${
              pathname?.startsWith("/docs")
                ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                : "hover:text-white"
            }`}
          >
            Docs
          </Link>
          <div className="relative" ref={faucetRef}>
            <button
              type="button"
              onClick={() => setFaucetOpen((v) => !v)}
              className="hover:text-white"
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
          <Link
            href="/about"
            className={`rounded-[8px] px-2 py-1 transition-colors ${
              pathname?.startsWith("/about")
                ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                : "hover:text-white"
            }`}
          >
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/markets"
            className="inline-flex items-center rounded-[12px] border border-[#1d7f50] bg-[#0f9a5f] px-3 py-1.5 text-[13px] font-medium text-white shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25)]"
          >
            Use Prydox
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/15 text-[#dfffea] transition-colors hover:border-white/30 hover:text-white md:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="border-t border-white/10 bg-[#0c0d0e] px-6 py-3 md:hidden">
          <nav className="flex flex-col gap-1 text-[14px] text-[#cce2d8]">
            <Link
              href="/products"
              className={`rounded-[8px] px-2.5 py-2 transition-colors ${
                pathname?.startsWith("/products")
                  ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              Products
            </Link>
            <Link
              href="/developer"
              className={`rounded-[8px] px-2.5 py-2 transition-colors ${
                pathname?.startsWith("/developer") || pathname?.startsWith("/developers")
                  ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              Developer
            </Link>
            <Link
              href="/docs"
              className={`rounded-[8px] px-2.5 py-2 transition-colors ${
                pathname?.startsWith("/docs")
                  ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              Docs
            </Link>
            <Link
              href="/about"
              className={`rounded-[8px] px-2.5 py-2 transition-colors ${
                pathname?.startsWith("/about")
                  ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                  : "hover:bg-white/5 hover:text-white"
              }`}
            >
              About
            </Link>
            <div className="mt-2 rounded-[10px] border border-white/10 bg-black/20 p-2.5">
              <p className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-[#9db2a8]">Faucet</p>
              <a
                href="https://liteforge.hub.caldera.xyz/"
                className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-[13px] text-[var(--fg)] transition-colors hover:bg-[var(--surface2)]"
              >
                <Image src="/zkltc.png" alt="zkLTC" width={16} height={16} className="rounded-full" />
                zkLTC
              </a>
              <a
                href="https://www.midashand.xyz/"
                className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-[13px] text-[var(--fg)] transition-colors hover:bg-[var(--surface2)]"
              >
                <Image src="/usdc.png" alt="USDC" width={16} height={16} className="rounded-full" />
                USDC
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
