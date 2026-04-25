"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/products", label: "Products" },
  { href: "/developer", label: "Developer" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
] as const;

export function TopBar({ home = false }: { home?: boolean }) {
  const pathname = usePathname();

  return (
    <header
      className="-mx-4 border-b border-white/10 bg-[#080909]/95 backdrop-blur-xl md:-mx-8"
    >
      <div className="mx-auto max-w-[1100px] px-4 md:px-8">
        <div className="flex h-14 items-center justify-between gap-4 md:h-16">
          <div className="flex min-w-0 shrink-0 items-center gap-0">
            <Image
              src="/logo/prydox-logo.png"
              alt="Prydox logo"
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 rounded-[6px] object-cover object-left shadow-[0_0_0_1px_rgba(255,255,255,0.12)] md:h-10 md:w-10"
              priority
            />
            {home ? (
              <span className="-ml-2.5 text-[16px] font-bold tracking-normal text-[var(--fg)] md:text-[18px]">
                rydox
              </span>
            ) : (
              <Link
                href="/"
                className="-ml-2.5 block text-[16px] font-bold tracking-normal text-[var(--fg)] transition-colors hover:text-[var(--accent-bright)] md:text-[18px]"
              >
                rydox
              </Link>
            )}
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
            <nav
              className="hidden min-w-0 items-center justify-end gap-3 md:flex"
              aria-label="Main"
            >
              {nav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
            <Link
              href="/markets"
              className="inline-flex items-center rounded-[12px] border border-[#1d7f50] bg-[#0f9a5f] px-4 py-2 text-[12px] font-semibold text-white shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25)] transition-colors hover:bg-[#12ad6b]"
            >
              Use Prydox
            </Link>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-[var(--border)] py-2 md:hidden"
          aria-label="Main mobile"
        >
          {nav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} compact />
          ))}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  item,
  pathname,
  compact,
}: {
  item: (typeof nav)[number];
  pathname: string | null;
  compact?: boolean;
}) {
  const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      className={`shrink-0 font-medium transition-colors ${
        compact ? "px-2 py-1 text-[12px]" : "px-1 py-1 text-[13px]"
      } ${
        active
          ? "text-[var(--fg)]"
          : "text-[var(--muted)] hover:text-[var(--fg)]"
      }`}
    >
      {item.label}
    </Link>
  );
}
