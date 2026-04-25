"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowsLeftRight,
  BookOpenText,
  ChartLineUp,
  Coins,
  House,
  Lightning,
  ShieldCheck,
  Target,
  UsersThree,
} from "@phosphor-icons/react";

const marketLinks = [
  { href: "/markets", label: "Markets", icon: ChartLineUp },
  { href: "/positions", label: "Positions", icon: Target },
  { href: "/borrow", label: "Borrow", icon: Coins },
  { href: "/lend", label: "Lend", icon: ArrowsLeftRight },
  { href: "/flash", label: "Flash Loans", icon: Lightning },
] as const;

const activityLinks = [{ href: "/activities", label: "Activities", icon: House }] as const;

const protocolLinks = [
  { href: "/docs", label: "Docs", icon: BookOpenText },
  { href: "/security", label: "Security", icon: ShieldCheck },
  { href: "/community", label: "Community", icon: UsersThree },
  { href: "/developer", label: "Developer", icon: UsersThree },
  { href: "/about", label: "About", icon: BookOpenText },
] as const;

export function ProtocolSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  return (
    <aside className="protocol-sidebar-scroll hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-[#101112] md:block">
      <div className="flex min-h-full flex-col p-4">
        <Link href="/" className="mb-7 mt-2 flex items-center gap-0">
          <Image
            src="/logo/prydox-logo.png"
            alt="Prydox logo"
            width={36}
            height={36}
            className="h-8 w-8 rounded-[7px] object-cover object-left"
          />
          <span className="-ml-1.5 text-[16px] font-semibold tracking-tight text-[#f1f2f4]">
            rydox
          </span>
        </Link>
        <div className="mb-6">
          <p className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-[#969ca5]">
            Markets
          </p>
          <nav className="mt-2 space-y-1">
            {marketLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-medium transition ${
                    active
                      ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                      : "text-[#c4c8cf] hover:bg-[#1b1d1f] hover:text-white"
                  }`}
                >
                  <Icon size={16} weight={active ? "fill" : "regular"} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mb-6">
          <p className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-[#969ca5]">
            Activities
          </p>
          <div className="mt-2 space-y-1">
            {activityLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-medium transition ${
                    active
                      ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                      : "text-[#c4c8cf] hover:bg-[#1b1d1f] hover:text-white"
                  }`}
                >
                  <Icon size={16} weight={active ? "fill" : "regular"} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-[#969ca5]">
            Protocol
          </p>
          <ul className="mt-2 space-y-1">
            {protocolLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className={`rounded-[10px] px-3 py-2 text-[12px] transition ${
                    isActive(item.href)
                      ? "border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] text-[#c7f3dd]"
                      : "text-[#c4c8cf] hover:bg-[#1b1d1f] hover:text-white"
                  }`}
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon size={15} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-auto rounded-[10px] border border-white/10 bg-[#141618] p-3">
          <p className="text-[11px] font-medium text-[#c3c7ce]">Prydox Protocol</p>
          <p className="mt-1 text-[10px] text-[#80858e]">Built on LitVM Testnet</p>
          <p className="mt-2 text-[10px] text-[#7a8088]">© 2026 Prydox. All rights reserved.</p>
        </div>
      </div>
    </aside>
  );
}
