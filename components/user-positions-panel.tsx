"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { formatApyPct } from "@/lib/aave-math";
import { usePoolReserves } from "@/hooks/use-pool-reserves";
import { useUserPositions } from "@/hooks/use-user-positions";

const ZERO = BigInt(0);

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] py-3 last:border-b-0">
      <span className="text-[12px] text-[var(--muted)]">{label}</span>
      <span
        className={`text-[13px] font-semibold text-[var(--fg)] ${mono ? "font-mono-tight tabular-nums" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function TokenCell({ symbol }: { symbol: "USDC" | "LTC" | "ZKLTC" }) {
  const isUsdc = symbol === "USDC";
  const label = isUsdc ? "USDC" : "zkLTC";
  const icon = isUsdc ? "/usdc.png" : "/zkltc.png";
  return (
    <div className="flex items-center gap-2">
      <img src={icon} alt={label} className="h-5 w-5 rounded-full" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Renders only when the wallet is connected on LitVM and the user has supplied
 * or borrowed on the pool (on-chain non-zero position).
 */
export function UserPositionsPanel() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { status } = useAccount();
  const {
    data,
    hasActivePosition,
    isLoading,
    isError,
  } = useUserPositions();
  const { data: reserves } = usePoolReserves();

  const supplyApy = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of reserves ?? []) {
      m[r.symbol.toUpperCase()] = r.supplyApyPct;
    }
    return m;
  }, [reserves]);
  const borrowApy = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of reserves ?? []) {
      m[r.symbol.toUpperCase()] = r.variableBorrowApyPct;
    }
    return m;
  }, [reserves]);
  const resolveSupplyApy = (symbol: "USDC" | "LTC" | "ZKLTC") => {
    if (symbol === "ZKLTC") return supplyApy.ZKLTC ?? supplyApy.LTC ?? 0;
    return supplyApy[symbol] ?? 0;
  };
  const resolveBorrowApy = (symbol: "USDC" | "LTC" | "ZKLTC") => {
    if (symbol === "ZKLTC") return borrowApy.ZKLTC ?? borrowApy.LTC ?? 0;
    return borrowApy[symbol] ?? 0;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (status !== "connected") return null;
  if (isLoading) return null;
  if (isError || !data || !hasActivePosition) return null;

  const { usdc, ltc, zkltc, account, maxLtvAsCollateral } = data;
  const supplyRows = [usdc, ltc].filter((row) => row.suppliedWei > ZERO);
  const debtRows = [usdc, ltc, zkltc].filter(
    (row) => row.variableDebtWei > ZERO || row.stableDebtWei > ZERO,
  );
  const collateralRows = [zkltc].filter((row) => row.suppliedWei > ZERO);
  const hasBorrowDebt = debtRows.length > 0;
  const hasSupply = supplyRows.length > 0;
  if (pathname !== "/lend" && pathname !== "/borrow") return null;
  if (pathname === "/lend" && (!hasSupply || hasBorrowDebt)) return null;
  if (pathname === "/borrow" && !hasBorrowDebt) return null;
  const showBorrowingSafetyCard = Boolean(account);

  return (
    <section
      className="border-y border-[var(--border)] bg-[rgba(8,10,14,0.65)] px-6 py-10 md:px-12"
      aria-label="Your pool positions"
    >
      <div className="mx-auto max-w-[1160px]">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-[clamp(20px,2.4vw,26px)] font-bold tracking-tight text-[var(--fg)]">
              {pathname === "/borrow" ? "Your borrow position" : "Your supply position"}
            </h2>
            <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-[var(--muted)]">
              {pathname === "/borrow"
                ? "Borrow view: see live debt, locked collateral, and safety metrics from chain."
                : "Supply view: see live supplied balances and supply APY from chain."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pathname !== "/lend" ? (
              <Link
                href="/lend"
                className="rounded-[8px] bg-[var(--ltc)] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--ltc-bright)]"
              >
                Lend
              </Link>
            ) : null}
            {pathname !== "/borrow" ? (
              <Link
                href="/borrow"
                className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-semibold text-[var(--fg)] transition-colors hover:border-[var(--ltc-line)]"
              >
                Borrow
              </Link>
            ) : null}
          </div>
        </div>

        {supplyRows.length > 0 ? (
          <div className="mb-5 overflow-x-auto rounded-[14px] border border-[var(--border)]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface2)]">
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Supplied asset
                  </th>
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Supplied (underlying)
                  </th>
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Supply APY
                  </th>
                </tr>
              </thead>
              <tbody>
                {supplyRows.map((row) => (
                  <tr
                    key={`supply-${row.symbol}`}
                    className="border-b border-[var(--border)] bg-[var(--surface)] last:border-b-0"
                  >
                    <td className="px-5 py-4 font-semibold text-[var(--fg)] md:px-6">
                      <TokenCell symbol={row.symbol} />
                    </td>
                    <td className="px-5 py-4 font-mono-tight text-[13px] tabular-nums text-[var(--fg)] md:px-6">
                      {row.supplied}
                    </td>
                    <td className="px-5 py-4 font-mono-tight text-[13px] text-[var(--positive)] md:px-6">
                      {formatApyPct(resolveSupplyApy(row.symbol))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {debtRows.length > 0 ? (
          <div className="overflow-x-auto rounded-[14px] border border-[var(--border)]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface2)]">
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Borrowed asset
                  </th>
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Variable debt (underlying)
                  </th>
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Borrow APY
                  </th>
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Stable debt
                  </th>
                </tr>
              </thead>
              <tbody>
                {debtRows.map((row) => (
                  <tr
                    key={`debt-${row.symbol}`}
                    className="border-b border-[var(--border)] bg-[var(--surface)] last:border-b-0"
                  >
                    <td className="px-5 py-4 font-semibold text-[var(--fg)] md:px-6">
                      <TokenCell symbol={row.symbol} />
                    </td>
                    <td className="px-5 py-4 font-mono-tight text-[13px] tabular-nums text-[var(--fg)] md:px-6">
                      {row.variableDebt}
                    </td>
                    <td className="px-5 py-4 font-mono-tight text-[13px] text-[var(--warning)] md:px-6">
                      {formatApyPct(resolveBorrowApy(row.symbol))}
                    </td>
                    <td className="px-5 py-4 font-mono-tight text-[13px] tabular-nums text-[var(--fg)] md:px-6">
                      {row.stableDebtWei > ZERO ? row.stableDebt : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {pathname === "/borrow" && collateralRows.length > 0 ? (
          <div className="mt-5 overflow-x-auto rounded-[14px] border border-[var(--border)]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface2)]">
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Locked collateral
                  </th>
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Amount
                  </th>
                  <th className="px-5 py-3 font-mono-tight text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)] md:px-6">
                    Yield
                  </th>
                </tr>
              </thead>
              <tbody>
                {collateralRows.map((row) => (
                  <tr
                    key={`collateral-${row.symbol}`}
                    className="border-b border-[var(--border)] bg-[var(--surface)] last:border-b-0"
                  >
                    <td className="px-5 py-4 font-semibold text-[var(--fg)] md:px-6">
                      <TokenCell symbol={row.symbol} />
                    </td>
                    <td className="px-5 py-4 font-mono-tight text-[13px] tabular-nums text-[var(--fg)] md:px-6">
                      {row.supplied}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-[var(--muted)] md:px-6">
                      None (collateral only)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {showBorrowingSafetyCard && account ? (
          <div className="mb-8 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6">
            <p className="font-mono-tight text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted-2)]">
              Borrowing &amp; safety (USD, oracle)
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
              Dollar figures use the protocol oracle (market prices), not your spot wallet balances.
            </p>
            <div className="mt-4 grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
              <Row
                label="Collateral value"
                value={account.totalCollateralUsd}
                mono
              />
              <Row label="Total debt owed" value={account.totalDebtUsd} mono />
              <Row
                label="Health factor"
                value={
                  account.healthFactor === null ? "—" : account.healthFactor
                }
                mono
              />
              <Row
                label="Weighted LTV (your mix)"
                value={account.weightedLtv}
                mono
              />
              <Row
                label="Max LTV as collateral (pool)"
                value={`USDC ${maxLtvAsCollateral.USDC} · zkLTC ${maxLtvAsCollateral.ZKLTC}`}
              />
              <Row
                label="More you could borrow"
                value={account.availableBorrowsUsd}
                mono
              />
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted-2)]">
              {hasBorrowDebt ? (
                <>
                  Health factor &gt; 1 means your position is safer from liquidation under normal
                  conditions. Variable-rate debt is listed per asset below; stable debt has its own
                  column.
                </>
              ) : (
                <>
                  No debt yet, so health factor is not shown.{" "}
                  <span className="text-[var(--muted)]">
                    Weighted LTV matches your collateral mix (e.g. USDC-supplied collateral uses a
                    different cap than zkLTC). Max LTV per asset is read from pool reserve config.
                  </span>
                </>
              )}
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted-2)]">
          Refreshes from network every ~12s. zkLTC collateral is shown separately and does not
          earn supply APY.
        </p>
      </div>
    </section>
  );
}
