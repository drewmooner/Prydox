"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { formatApyPct, formatUsdCompact } from "@/lib/aave-math";
import { usePoolReserves } from "@/hooks/use-pool-reserves";

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

type StatAlign = "center" | "left" | "right";

/** Staggered reveal after curved spoke finishes drawing */
function StatLine({
  kicker,
  value,
  hint,
  align = "center",
  revealDelaySec,
  reduceMotion,
}: {
  kicker: string;
  value: string;
  hint?: string;
  align?: StatAlign;
  revealDelaySec: number;
  reduceMotion: boolean;
}) {
  const ta =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";

  return (
    <div
      className={reduceMotion ? ta : `${ta} hub-stat-reveal`}
      style={
        reduceMotion
          ? undefined
          : { animationDelay: `${revealDelaySec}s` }
      }
    >
      <p className="font-mono-tight text-[9px] font-medium uppercase tracking-[0.26em] text-[var(--muted-2)]">
        {kicker}
      </p>
      <p className="mt-0.5 font-display text-[clamp(1.25rem,3.8vw,1.85rem)] font-semibold tabular-nums tracking-[-0.03em] text-[var(--fg)] [text-shadow:0_1px_20px_rgba(5,6,8,0.8)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[10px] leading-snug text-[var(--muted)] sm:text-[11px]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Central logo + hub ring; curved SVG paths animate outward, stats reveal in sequence.
 * Paths use cubic Beziers (not straight lines). stroke-dash animation via CSS + pathLength.
 */
export function LandingHeroStats() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const { data, tvlUsd, isLoading, isError } = usePoolReserves();
  const ltvPct =
    Number(process.env.NEXT_PUBLIC_BORROW_LTV_BPS ?? 7000) / 100;

  const { usdcRow, zkltcRow, usdcUtil, usdcApy } = useMemo(() => {
    let u:
      | {
          supplied: number;
          borrowed: number;
          supplyApyPct: number;
          utilizationPct: number;
        }
      | undefined;
    let z: { supplied: number; borrowed: number } | undefined;
    for (const r of data ?? []) {
      const sym = r.symbol.toUpperCase();
      if (sym === "USDC") {
        u = {
          supplied: Number(r.totalSupplied),
          borrowed: Number(r.totalBorrowedVar),
          supplyApyPct: r.supplyApyPct,
          utilizationPct: r.utilizationPct,
        };
      }
      if (sym === "ZKLTC" || sym === "LTC") {
        const next = {
          supplied: Number(r.totalSupplied),
          borrowed: Number(r.totalBorrowedVar),
        };
        if (!z || sym === "ZKLTC") z = next;
      }
    }
    const util = u?.utilizationPct ?? 0;
    return {
      usdcRow: u,
      zkltcRow: z,
      usdcUtil: util,
      usdcApy: u?.supplyApyPct ?? 0,
    };
  }, [data]);

  const loading = isLoading;
  const dash = "—";

  const tvlStr =
    loading || isError
      ? dash
      : tvlUsd !== undefined
        ? formatUsdCompact(tvlUsd)
        : dash;

  const tvlHint =
    !loading && !isError && usdcRow && zkltcRow
      ? `${fmt(usdcRow.supplied)} USDC · ${fmt(zkltcRow.supplied)} zkLTC`
      : !loading && !isError
        ? "Oracle-priced"
        : undefined;

  const apyStr =
    loading || isError
      ? dash
      : usdcRow !== undefined
        ? formatApyPct(usdcApy)
        : dash;

  const utilStr =
    loading || isError
      ? dash
      : usdcRow !== undefined
        ? `${usdcUtil.toFixed(1)}%`
        : dash;

  const ltvStr = loading ? dash : `${ltvPct}%`;

  const line = "rgba(255,255,255,0.18)";

  /** viewBox 0–100: circle r=27 → logo/spoke geometry scales together */
  const R = 27;
  const pathDur = 0.75;
  const pathStagger = 0.14;
  /** Stat fades in just after its path finishes (pathDelay + pathDur - small overlap) */
  const statDelay = (i: number) =>
    reduceMotion ? 0 : i * pathStagger + pathDur - 0.06;

  const pathClass = reduceMotion ? "" : "hub-path-draw";

  return (
    <div className="relative mx-auto mt-14 w-full max-w-[min(100%,720px)] md:mt-16">
      <p className="mb-7 font-mono-tight text-[10px] uppercase tracking-[0.28em] text-[var(--muted-2)] md:mb-8">
        Live pool · hub view
      </p>

      <div className="relative mx-auto aspect-square w-full max-w-[min(100%,640px)] md:max-w-[min(100%,700px)]">
        <svg
          className="pointer-events-none absolute inset-0 z-[8] h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <circle
            className={reduceMotion ? "" : "hub-ring-in"}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={line}
            strokeWidth="0.11"
            vectorEffect="nonScalingStroke"
            opacity={reduceMotion ? 0.55 : undefined}
          />

          {/* N — longer curve to upper edge (fills vertical space) */}
          <path
            pathLength={1}
            d="M 50 23 C 45.5 9 54.5 9 50 1.5"
            fill="none"
            stroke={line}
            strokeWidth="0.11"
            strokeLinecap="round"
            vectorEffect="nonScalingStroke"
            className={pathClass}
            style={
              reduceMotion
                ? { strokeDashoffset: 0, strokeDasharray: 1 }
                : { animationDelay: `${0 * pathStagger}s` }
            }
          />
          {/* E */}
          <path
            pathLength={1}
            d="M 77 50 C 88 38 96 62 98.5 50"
            fill="none"
            stroke={line}
            strokeWidth="0.11"
            strokeLinecap="round"
            vectorEffect="nonScalingStroke"
            className={pathClass}
            style={
              reduceMotion
                ? { strokeDashoffset: 0, strokeDasharray: 1 }
                : { animationDelay: `${1 * pathStagger}s` }
            }
          />
          {/* S */}
          <path
            pathLength={1}
            d="M 50 77 C 54.5 91 45.5 91 50 98.5"
            fill="none"
            stroke={line}
            strokeWidth="0.11"
            strokeLinecap="round"
            vectorEffect="nonScalingStroke"
            className={pathClass}
            style={
              reduceMotion
                ? { strokeDashoffset: 0, strokeDasharray: 1 }
                : { animationDelay: `${2 * pathStagger}s` }
            }
          />
          {/* W */}
          <path
            pathLength={1}
            d="M 23 50 C 12 38 4 62 1.5 50"
            fill="none"
            stroke={line}
            strokeWidth="0.11"
            strokeLinecap="round"
            vectorEffect="nonScalingStroke"
            className={pathClass}
            style={
              reduceMotion
                ? { strokeDashoffset: 0, strokeDasharray: 1 }
                : { animationDelay: `${3 * pathStagger}s` }
            }
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 z-[15]">
          <div className="pointer-events-auto absolute left-1/2 top-0 z-10 w-[min(96%,340px)] -translate-x-1/2">
            <StatLine
              kicker="Total value locked"
              value={tvlStr}
              hint={tvlHint}
              align="center"
              revealDelaySec={statDelay(0)}
              reduceMotion={reduceMotion}
            />
          </div>
          <div className="pointer-events-auto absolute right-0 top-1/2 z-10 w-[min(48%,240px)] -translate-y-1/2 sm:w-[min(44%,260px)]">
            <StatLine
              kicker="USDC supply APY"
              value={apyStr}
              align="right"
              revealDelaySec={statDelay(1)}
              reduceMotion={reduceMotion}
            />
          </div>
          <div className="pointer-events-auto absolute bottom-0 left-1/2 z-10 w-[min(96%,340px)] -translate-x-1/2">
            <StatLine
              kicker="Pool utilization"
              value={utilStr}
              align="center"
              revealDelaySec={statDelay(2)}
              reduceMotion={reduceMotion}
            />
          </div>
          <div className="pointer-events-auto absolute left-0 top-1/2 z-10 w-[min(48%,240px)] -translate-y-1/2 sm:w-[min(44%,260px)]">
            <StatLine
              kicker="Max borrow LTV"
              value={ltvStr}
              align="left"
              revealDelaySec={statDelay(3)}
              reduceMotion={reduceMotion}
            />
          </div>
        </div>

        {/* Logo: diameter = 2R in viewBox → 54% of hub */}
        <div className="absolute left-1/2 top-1/2 z-30 aspect-square w-[54%] min-w-[160px] max-w-[280px] -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-[var(--bg)]">
            <Image
              src="/logo/prydox-logo.png"
              alt="Prydox"
              fill
              className="object-cover object-center"
              sizes="(max-width:768px) 200px, 280px"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
