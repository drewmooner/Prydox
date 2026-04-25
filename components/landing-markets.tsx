"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatApyPct } from "@/lib/aave-math";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SectionHeading } from "@/components/section-heading";
import { usePoolReserves } from "@/hooks/use-pool-reserves";

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function LandingMarkets() {
  const { data, isLoading, isError } = usePoolReserves();

  const { usdc, zkltc } = useMemo(() => {
    let u:
      | {
          supplied: number;
          borrowed: number;
          utilizationPct: number;
          supplyApyPct: number;
        }
      | undefined;
    let z:
      | {
          supplied: number;
          borrowed: number;
          utilizationPct: number;
          supplyApyPct: number;
        }
      | undefined;
    for (const r of data ?? []) {
      const sym = r.symbol.toUpperCase();
      const row = {
        supplied: Number(r.totalSupplied),
        borrowed: Number(r.totalBorrowedVar),
        utilizationPct: r.utilizationPct,
        supplyApyPct: r.supplyApyPct,
      };
      if (sym === "USDC") u = row;
      if (sym === "ZKLTC" || sym === "LTC") {
        if (!z || sym === "ZKLTC") z = row;
      }
    }
    return { usdc: u, zkltc: z };
  }, [data]);

  const uUsdc = usdc?.utilizationPct ?? 0;
  const uLtc = zkltc?.utilizationPct ?? 0;

  return (
    <section
      id="markets"
      className="mx-auto max-w-[1160px] px-6 py-[72px] md:px-12 lg:px-[48px]"
    >
      <ScrollReveal>
        <SectionHeading
          title="Liquidity and on-chain rates"
          subtitle="The table below shows live reserve balances and supply-side APY from the pool data provider and price feeds. Figures auto-refresh from LitVM even when no wallet is connected."
        />
      </ScrollReveal>

      <ScrollReveal delayClass="reveal-delay-2" className="mt-12">
        <div className="overflow-x-auto rounded-[16px] border border-[var(--border)]">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface2)]">
                <th className="px-6 py-3.5 font-mono-tight text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted-2)] md:px-7">
                  Asset
                </th>
                <th className="px-6 py-3.5 font-mono-tight text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted-2)] md:px-7">
                  Total supplied
                </th>
                <th className="hidden px-6 py-3.5 font-mono-tight text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted-2)] sm:table-cell md:px-7">
                  Utilization
                </th>
                <th className="hidden px-6 py-3.5 font-mono-tight text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted-2)] md:table-cell md:px-7">
                  APY
                </th>
                <th className="px-6 py-3.5 text-right font-mono-tight text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted-2)] md:px-7">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)] transition-colors hover:bg-[var(--surface2)]">
                <td className="px-6 py-5 md:px-7">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[var(--ltc-line)] bg-[var(--ltc-glow)] font-mono-tight text-[10px] font-medium text-[var(--ltc-bright)]">
                      USDC
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[var(--fg)]">
                        USD Coin
                      </div>
                      <div className="mt-0.5 text-[12px] text-[var(--muted-2)]">
                        Deposit · Earn yield
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 font-mono-tight text-[14px] text-[var(--fg)] md:px-7">
                  {isLoading ? "—" : isError ? "Error" : usdc ? fmt(usdc.supplied) : "—"}
                </td>
                <td className="hidden sm:table-cell md:px-7">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1 w-[72px] overflow-hidden rounded-sm bg-[var(--surface3)]">
                      <div
                        className="h-full rounded-sm bg-[var(--ltc)]"
                        style={{
                          width: `${isLoading ? 0 : uUsdc}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono-tight text-[12px] text-[var(--muted)]">
                      {isLoading ? "—" : isError ? "—" : `${uUsdc.toFixed(0)}%`}
                    </span>
                  </div>
                </td>
                <td className="hidden font-mono-tight text-[14px] font-medium text-[var(--positive)] md:table-cell md:px-7">
                  {formatApyPct(
                    !isLoading && !isError && usdc && Number.isFinite(usdc.supplyApyPct)
                      ? usdc.supplyApyPct
                      : 0,
                  )}
                </td>
                <td className="px-6 py-5 text-right md:px-7">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,197,94,0.15)] bg-[rgba(34,197,94,0.08)] px-3 py-1 font-mono-tight text-[12px] font-semibold text-[var(--positive)]">
                    ● Active
                  </span>
                </td>
              </tr>
              <tr className="bg-[var(--surface)] transition-colors hover:bg-[var(--surface2)]">
                <td className="px-6 py-5 md:px-7">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[var(--ltc-line)] bg-[rgba(52,93,157,0.06)] font-mono-tight text-[10px] font-medium text-[var(--ltc)]">
                      zkLTC
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[var(--fg)]">
                        zkLitecoin
                      </div>
                      <div className="mt-0.5 text-[12px] text-[var(--muted-2)]">
                        Collateral · 70% LTV
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 font-mono-tight text-[14px] text-[var(--fg)] md:px-7">
                  {isLoading ? "—" : zkltc ? fmt(zkltc.supplied) : "—"}
                </td>
                <td className="hidden sm:table-cell md:px-7">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1 w-[72px] overflow-hidden rounded-sm bg-[var(--surface3)]">
                      <div
                        className="h-full rounded-sm bg-[var(--ltc)]"
                        style={{
                          width: `${isLoading ? 0 : uLtc}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono-tight text-[12px] text-[var(--muted)]">
                      {isLoading
                        ? "—"
                        : isError
                          ? "—"
                          : zkltc && zkltc.supplied > 0
                            ? `${uLtc.toFixed(0)}%`
                            : "—"}
                    </span>
                  </div>
                </td>
                <td className="hidden font-mono-tight text-[14px] font-medium text-[var(--ltc-bright)] md:table-cell md:px-7">
                  {formatApyPct(
                    !isLoading && !isError && zkltc && Number.isFinite(zkltc.supplyApyPct)
                      ? zkltc.supplyApyPct
                      : 0,
                  )}
                </td>
                <td className="px-6 py-5 text-right md:px-7">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ltc-line)] bg-[var(--ltc-glow)] px-3 py-1 font-mono-tight text-[12px] font-semibold text-[var(--ltc-bright)]">
                    ● Live
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ScrollReveal>

      <ScrollReveal delayClass="reveal-delay-3" className="mt-7 text-center">
        <Link
          href="/lend"
          className="inline-block rounded-[7px] bg-[var(--ltc)] px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--ltc-bright)]"
        >
          View live markets →
        </Link>
      </ScrollReveal>
    </section>
  );
}
