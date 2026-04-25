"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ProtocolAppShell } from "@/components/protocol-app-shell";
import { usePoolReserves } from "@/hooks/use-pool-reserves";
import { formatApyPct } from "@/lib/aave-math";
import { prydoxConfig } from "@/app/lib/prydox-config";

const COINGECKO_USDC_LOGO =
  "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png";
const COINGECKO_LTC_LOGO =
  "https://assets.coingecko.com/coins/images/2/large/litecoin.png";

function fmtUsd(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtAmt(n: number, maxFrac = 4) {
  if (!Number.isFinite(n) || n === 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

type ActivityType = "supply" | "borrow" | "repay" | "withdraw" | "flash";

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  supply: "text-white bg-white/[0.06] border-white/20",
  borrow: "text-white bg-white/[0.06] border-white/20",
  repay: "text-white bg-white/[0.06] border-white/20",
  withdraw: "text-white bg-white/[0.06] border-white/20",
  flash: "text-white bg-white/[0.06] border-white/20",
};

function ActivityBadge({ type }: { type: ActivityType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ACTIVITY_COLORS[type]}`}
    >
      {type}
    </span>
  );
}

export default function ActivitiesPage() {
  const { data: reserves, tvlUsd, isLoading, isError } = usePoolReserves();

  const stats = useMemo(() => {
    if (!reserves || reserves.length === 0)
      return { totalDepositedUsd: 0, totalBorrowedUsd: 0, utilization: 0, flashLoanLiquidityUsd: 0 };

    let depositedUsd = 0;
    let borrowedUsd = 0;
    let zkltcSuppliedUsd = 0;

    for (const r of reserves) {
      const sym = r.symbol.toUpperCase();
      depositedUsd += r.totalSuppliedUsd ?? 0;
      borrowedUsd += r.totalBorrowedUsd ?? 0;
      if (sym === "ZKLTC" || sym === "LTC") {
        zkltcSuppliedUsd += r.totalSuppliedUsd ?? 0;
      }
    }
    const utilization = depositedUsd > 0 ? Math.min(100, (borrowedUsd / depositedUsd) * 100) : 0;
    return { totalDepositedUsd: depositedUsd, totalBorrowedUsd: borrowedUsd, utilization, flashLoanLiquidityUsd: zkltcSuppliedUsd };
  }, [reserves]);

  const usdcReserve = reserves?.find((r) => r.symbol.toUpperCase() === "USDC");

  return (
    <ProtocolAppShell
      title="Activities"
      subtitle="Live protocol activity, market metrics, and flash loan liquidity."
    >
      <div className="space-y-10 pb-8">
        {/* Live Activity Stats */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Value Locked",
              value: isLoading ? "—" : isError ? "Error" : fmtUsd(tvlUsd ?? 0),
              sub: "All reserves",
              tone: "text-[#8be4b7]",
            },
            {
              label: "Total Deposited",
              value: isLoading ? "—" : isError ? "Error" : fmtUsd(stats.totalDepositedUsd),
              sub: "Lending deposits",
              tone: "text-[var(--fg)]",
            },
            {
              label: "Total Borrowed",
              value: isLoading ? "—" : isError ? "Error" : fmtUsd(stats.totalBorrowedUsd),
              sub: "Active debt",
              tone: "text-[#d3b88a]",
            },
            {
              label: "Pool Utilization",
              value: isLoading ? "—" : isError ? "Error" : `${stats.utilization.toFixed(2)}%`,
              sub: "Borrowed / deposited",
              tone: "text-[var(--fg)]",
            },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
              <p className={`mt-1 text-[30px] font-semibold tracking-tight ${s.tone}`}>
                {s.value}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--muted-2)]">{s.sub}</p>
            </div>
          ))}
        </section>

        <div className="border-t border-[var(--border)]" />

        {/* Reserve Activity Table */}
        <section>
          <h2 className="mb-0.5 text-[14px] font-semibold text-[#8be4b7]">Reserve Activity</h2>
          <p className="mb-4 text-[11px] text-[var(--muted)]">
            Live deposit and borrow volumes per reserve. Refreshes every 15 seconds.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-2 py-2">Asset</th>
                  <th className="px-2 py-2">Total Deposited</th>
                  <th className="px-2 py-2">Total Borrowed</th>
                  <th className="px-2 py-2">Available</th>
                  <th className="px-2 py-2">Supply APY</th>
                  <th className="px-2 py-2">Borrow APY</th>
                  <th className="px-2 py-2">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-white/5">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-2 py-3">
                          <div className="h-3.5 rounded bg-[var(--surface3)]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !reserves || reserves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-[12px] text-[var(--muted)]">
                      No reserve data available.
                    </td>
                  </tr>
                ) : (
                  reserves.filter((r, idx, arr) => {
                    const isZkltc = r.symbol.toUpperCase() === "ZKLTC" || r.symbol.toUpperCase() === "LTC";
                    if (!isZkltc) return true;
                    return arr.findIndex((x) => x.symbol.toUpperCase() === "ZKLTC" || x.symbol.toUpperCase() === "LTC") === idx;
                  }).map((r) => {
                    const isZkltc = r.symbol.toUpperCase() === "ZKLTC" || r.symbol.toUpperCase() === "LTC";
                    const logo = isZkltc ? COINGECKO_LTC_LOGO : COINGECKO_USDC_LOGO;
                    const label = isZkltc ? "zkLTC" : r.symbol;
                    const supplied = Number(r.totalSupplied || "0");
                    const borrowed = Number(r.totalBorrowedVar || "0");
                    const available = Math.max(supplied - borrowed, 0);
                    return (
                      <tr key={r.asset} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                        <td className="px-2 py-2.5">
                          <span className="inline-flex items-center gap-2 font-semibold text-[var(--fg)]">
                            <Image src={logo} alt={label} width={18} height={18} className="rounded-full" />
                            {label}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-[var(--fg)]">
                          {fmtAmt(supplied)} {label}
                          <span className="ml-1.5 text-[10px] text-[var(--muted)]">({fmtUsd(r.totalSuppliedUsd)})</span>
                        </td>
                        <td className="px-2 py-2.5 text-[#d3b88a]">
                          {fmtAmt(borrowed)} {label}
                          <span className="ml-1.5 text-[10px] text-[var(--muted)]">({fmtUsd(r.totalBorrowedUsd)})</span>
                        </td>
                        <td className="px-2 py-2.5 text-[#8be4b7]">{fmtAmt(available)} {label}</td>
                        <td className="px-2 py-2.5 text-[#8be4b7]">{formatApyPct(r.supplyApyPct)}</td>
                        <td className="px-2 py-2.5 text-[#d3b88a]">{formatApyPct(r.variableBorrowApyPct)}</td>
                        <td className="px-2 py-2.5 text-[var(--muted)]">{r.utilizationPct.toFixed(2)}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="border-t border-[var(--border)]" />

        {/* Flash Loan Activity */}
        <section>
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-[#8be4b7]">Flash Loan Activity</h2>
            <span className="rounded-full border border-[#5c1e5c] bg-[rgba(100,20,150,0.12)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#d08ae4]">
              Atomic
            </span>
          </div>
          <p className="mb-6 text-[11px] leading-relaxed text-[var(--muted)]">
            Flash loans allow borrowing and repaying within a single transaction. Lenders who supply zkLTC or USDC
            earn flash loan premiums automatically — no extra action required.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-[10px] text-[var(--muted)]">zkLTC Flash Liquidity</p>
              <p className="mt-1 text-[24px] font-semibold text-[var(--fg)]">
                {isLoading ? "—" : fmtUsd(stats.flashLoanLiquidityUsd)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--muted)]">USDC Flash Liquidity</p>
              <p className="mt-1 text-[24px] font-semibold text-[var(--fg)]">
                {isLoading ? "—" : fmtUsd(usdcReserve?.totalSuppliedUsd ?? 0)}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--muted-2)]">
                {isLoading ? "—" : `${fmtAmt(Number(usdcReserve?.totalSupplied ?? 0), 2)} USDC available`}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--muted)]">Premium Distribution</p>
              <p className="mt-1 text-[24px] font-semibold text-[var(--fg)]">Per pool</p>
              <p className="mt-0.5 text-[10px] text-[var(--muted-2)]">
                Fees split between suppliers and protocol treasury
              </p>
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-[var(--muted)]">
            <span className="font-semibold text-[#8be4b7]">How it works: </span>
            Your receiver contract must implement the flash loan callback, use the funds within the same transaction,
            and approve the pool to pull back principal + premium before the call ends. Prydox flash loans follow the
            Aave V3 interface —{" "}
            <Link href="/flash" className="text-[#8be4b7] underline underline-offset-2 hover:text-white">
              try the Flash Loan executor
            </Link>
            .
          </p>
        </section>

        <div className="border-t border-[var(--border)]" />

        {/* Activity Type Key + Explorer Link */}
        <section>
          <h2 className="mb-3 text-[14px] font-semibold text-[#8be4b7]">Activity Types</h2>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <ActivityBadge type="supply" />
            <ActivityBadge type="borrow" />
            <ActivityBadge type="repay" />
            <ActivityBadge type="withdraw" />
            <ActivityBadge type="flash" />
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            For full transaction history — deposits, borrows, repays, liquidations, and flash loans — view the protocol
            contracts on the block explorer.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`${prydoxConfig.explorer}/address/${prydoxConfig.pool}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-[8px] border border-[var(--border)] px-3 py-1.5 text-[11px] font-medium text-[#8be4b7] transition-colors hover:text-white"
            >
              Pool contract ↗
            </a>
            <a
              href={`${prydoxConfig.explorer}/address/${prydoxConfig.poolDataProvider}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-[8px] border border-[var(--border)] px-3 py-1.5 text-[11px] font-medium text-[#8be4b7] transition-colors hover:text-white"
            >
              Data provider ↗
            </a>
          </div>
        </section>
      </div>
    </ProtocolAppShell>
  );
}
