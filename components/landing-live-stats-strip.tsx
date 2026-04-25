"use client";

import { useMemo } from "react";
import { usePoolReserves } from "@/hooks/use-pool-reserves";

function fmtUsd(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function LandingLiveStatsStrip() {
  const { data: reserves, tvlUsd, isLoading, isError } = usePoolReserves();

  const { totalSuppliedUsd, totalBorrowedUsd, weightedUtilizationPct } = useMemo(() => {
    if (!reserves || reserves.length === 0) {
      return { totalSuppliedUsd: 0, totalBorrowedUsd: 0, weightedUtilizationPct: 0 };
    }

    let suppliedUsd = 0;
    let borrowedUsd = 0;
    for (const r of reserves) {
      suppliedUsd += Number(r.totalSuppliedUsd) || 0;
      borrowedUsd += Number(r.totalBorrowedUsd) || 0;
    }
    const utilization =
      suppliedUsd > 0
        ? Math.min(100, Math.max(0, (borrowedUsd / suppliedUsd) * 100))
        : 0;
    return {
      totalSuppliedUsd: suppliedUsd,
      totalBorrowedUsd: borrowedUsd,
      weightedUtilizationPct: utilization,
    };
  }, [reserves]);

  const tvlDisplay = isLoading ? "—" : isError ? "Error" : fmtUsd(tvlUsd ?? 0);
  const suppliedDisplay = isLoading ? "—" : isError ? "Error" : fmtUsd(totalSuppliedUsd);
  const borrowedDisplay = isLoading ? "—" : isError ? "Error" : fmtUsd(totalBorrowedUsd);
  const utilizationDisplay =
    isLoading ? "—" : isError ? "Error" : `${weightedUtilizationPct.toFixed(2)}%`;

  return (
    <section className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-8 md:px-10">
      <div className="grid md:grid-cols-4">
        <div className="px-6 py-5 md:border-r md:border-[#143629]">
          <p className="text-[12px] text-[#93b3a3]">Total Value Locked</p>
          <p className="mt-1 text-[38px] font-semibold tracking-tight text-[#86f2b7]">{tvlDisplay}</p>
          <p className="text-[13px] text-[#7f9d8e]">Live reserve TVL</p>
        </div>
        <div className="px-6 py-5 md:border-r md:border-[#143629]">
          <p className="text-[12px] text-[#93b3a3]">Total Supplied</p>
          <p className="mt-1 text-[38px] font-semibold tracking-tight text-[#86f2b7]">{suppliedDisplay}</p>
          <p className="text-[13px] text-[#7f9d8e]">Live supplied reserves</p>
        </div>
        <div className="px-6 py-5 md:border-r md:border-[#143629]">
          <p className="text-[12px] text-[#93b3a3]">Total Borrowed</p>
          <p className="mt-1 text-[38px] font-semibold tracking-tight text-[#86f2b7]">{borrowedDisplay}</p>
          <p className="text-[13px] text-[#7f9d8e]">Live borrowed reserves</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[12px] text-[#93b3a3]">Pool Utilization</p>
          <p className="mt-1 text-[38px] font-semibold tracking-tight text-[#86f2b7]">{utilizationDisplay}</p>
          <p className="text-[13px] text-[#7f9d8e]">Borrowed / supplied</p>
        </div>
      </div>
    </section>
  );
}

