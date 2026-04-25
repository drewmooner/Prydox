"use client";

import Image from "next/image";
import { usePoolReserves } from "@/hooks/use-pool-reserves";
import { ProtocolAppShell } from "@/components/protocol-app-shell";
import { formatApyPct } from "@/lib/aave-math";

const COINGECKO_USDC_LOGO =
  "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png";
const COINGECKO_LTC_LOGO =
  "https://assets.coingecko.com/coins/images/2/large/litecoin.png";

function fmt(n: string) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtCompact(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function MarketsPage() {
  const { data, isLoading, isPending } = usePoolReserves();
  const showLoading = isLoading || isPending;
  const skeletonRows = Array.from({ length: 2 }, (_, i) => `skeleton-${i}`);
  const rows = (() => {
    const src = data ?? [];
    const usdc = src.find((r) => r.symbol.toUpperCase() === "USDC");
    const ltcGroup = src.filter((r) => {
      const s = r.symbol.toUpperCase();
      return s === "LTC" || s === "ZKLTC";
    });

    const merged: typeof src = [];
    if (usdc) merged.push(usdc);
    if (ltcGroup.length > 0) {
      const totalSupplied = ltcGroup.reduce(
        (sum, r) => sum + Number(r.totalSupplied || "0"),
        0,
      );
      const totalBorrowedVar = ltcGroup.reduce(
        (sum, r) => sum + Number(r.totalBorrowedVar || "0"),
        0,
      );
      const utilizationPct =
        totalSupplied > 0 ? Math.min(100, (totalBorrowedVar / totalSupplied) * 100) : 0;
      const denom = totalSupplied > 0 ? totalSupplied : 1;
      const supplyApyPct =
        ltcGroup.reduce(
          (sum, r) => sum + r.supplyApyPct * Number(r.totalSupplied || "0"),
          0,
        ) / denom;
      const borrowWeightDenom =
        totalBorrowedVar > 0 ? totalBorrowedVar : denom;
      const variableBorrowApyPct =
        ltcGroup.reduce(
          (sum, r) =>
            sum +
            r.variableBorrowApyPct *
              Number(
                totalBorrowedVar > 0 ? r.totalBorrowedVar || "0" : r.totalSupplied || "0",
              ),
          0,
        ) / borrowWeightDenom;
      const base = ltcGroup[0];
      merged.push({
        ...base,
        symbol: "ZKLTC",
        totalSupplied: String(totalSupplied),
        totalBorrowedVar: String(totalBorrowedVar),
        utilizationPct,
        supplyApyPct,
        variableBorrowApyPct,
      });
    }
    if (merged.length === 0) {
      return [
        {
          symbol: "USDC",
          asset: "0x0000000000000000000000000000000000000001" as `0x${string}`,
          decimals: 6,
          totalSupplied: "0",
          totalBorrowedVar: "0",
          utilizationPct: 0,
          active: true,
          supplyApyPct: 0,
          grossSupplyApyPct: 0,
          variableBorrowApyPct: 0,
          protocolTakePct: 20,
          usdPrice: 1,
          totalSuppliedUsd: 0,
          totalBorrowedUsd: 0,
        },
        {
          symbol: "ZKLTC",
          asset: "0x0000000000000000000000000000000000000002" as `0x${string}`,
          decimals: 18,
          totalSupplied: "0",
          totalBorrowedVar: "0",
          utilizationPct: 0,
          active: true,
          supplyApyPct: 0,
          grossSupplyApyPct: 0,
          variableBorrowApyPct: 0,
          protocolTakePct: 20,
          usdPrice: 0,
          totalSuppliedUsd: 0,
          totalBorrowedUsd: 0,
        },
      ];
    }
    return merged;
  })();

  return (
    <ProtocolAppShell
      title="Markets"
      subtitle="Live reserves, APY, and utilization across Prydox."
    >
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-3 py-3">Asset</th>
                <th className="px-3 py-3">Supply APY</th>
                <th className="px-3 py-3">Borrow APY</th>
                <th className="px-3 py-3">Total Supplied</th>
                <th className="px-3 py-3">Total Liquidity</th>
                <th className="px-3 py-3">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {showLoading
                ? skeletonRows.map((key) => (
                    <tr
                      key={key}
                      className="border-b border-white/5 text-[13px] animate-pulse"
                    >
                      <td className="px-3 py-3">
                        <div className="h-4 w-24 rounded bg-[var(--surface3)]" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-4 w-16 rounded bg-[var(--surface3)]" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-4 w-16 rounded bg-[var(--surface3)]" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-4 w-20 rounded bg-[var(--surface3)]" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-4 w-20 rounded bg-[var(--surface3)]" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-4 w-14 rounded bg-[var(--surface3)]" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => {
                const isZkLtc = r.symbol.toUpperCase() === "ZKLTC" || r.symbol.toUpperCase() === "LTC";
                const assetLabel = isZkLtc ? "zkLTC" : r.symbol;
                const logoSrc = isZkLtc ? COINGECKO_LTC_LOGO : COINGECKO_USDC_LOGO;
                const totalSuppliedNum = Number(r.totalSupplied || "0");
                const totalBorrowedNum = Number(r.totalBorrowedVar || "0");
                const availableLiquidity = Math.max(totalSuppliedNum - totalBorrowedNum, 0);
                const availableLiquidityUsd = availableLiquidity * (r.usdPrice || 1);
                return (
                <tr key={r.asset} className="border-b border-white/5 text-[13px] transition-colors hover:bg-[var(--surface2)]">
                  <td className="px-3 py-3 font-semibold text-[var(--fg)]">
                    <span className="inline-flex items-center gap-2">
                      <Image src={logoSrc} alt={assetLabel} width={22} height={22} className="rounded-full" />
                      {assetLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--accent-bright)]">
                    {formatApyPct(Number.isFinite(r.supplyApyPct) ? r.supplyApyPct : 0)}
                  </td>
                  <td className="px-3 py-3 text-[#d3b88a]">
                    {formatApyPct(Number.isFinite(r.variableBorrowApyPct) ? r.variableBorrowApyPct : 0)}
                  </td>
                  <td className="px-3 py-3 text-[#c5ccd5]">{fmt(r.totalSupplied)}</td>
                  <td className="px-3 py-3 text-[#c5ccd5]">{fmtCompact(availableLiquidityUsd)}</td>
                  <td className="px-3 py-3 text-[#c5ccd5]">{r.utilizationPct.toFixed(2)}%</td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
        {showLoading ? (
          <p className="mt-2 text-[11px] text-[var(--muted)]">Refreshing live reserve stats...</p>
        ) : null}
      </div>
    </ProtocolAppShell>
  );
}

