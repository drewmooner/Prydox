/** Aave V3 rates are expressed in ray (1e27), per second. */
const RAY = 1e27;
const SECONDS_PER_YEAR = 31_536_000;

/**
 * Convert pool `liquidityRate` (ray/sec) to supply APY (%), compounded every second.
 */
export function liquidityRateToSupplyApyPct(liquidityRate: bigint): number {
  // Aave reserve rates are ray-scaled annual rates (not per-second rates).
  const apr = Number(liquidityRate) / RAY;
  if (!Number.isFinite(apr) || apr <= 0) return 0;
  const apy = (Math.pow(1 + apr / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100;
  if (!Number.isFinite(apy) || apy < 0) return 0;
  return Math.min(apy, 999);
}

/**
 * Convert pool `variableBorrowRate` (ray/sec) to variable borrow APY (%).
 */
export function variableBorrowRateToApyPct(variableBorrowRate: bigint): number {
  // Aave reserve rates are ray-scaled annual rates (not per-second rates).
  const apr = Number(variableBorrowRate) / RAY;
  if (!Number.isFinite(apr) || apr <= 0) return 0;
  const apy = (Math.pow(1 + apr / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100;
  if (!Number.isFinite(apy) || apy < 0) return 0;
  return Math.min(apy, 999);
}

export function formatUsdCompact(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1_000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatApyPct(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return "0.00%";
  if (pct < 0.01) return "<0.01%";
  return `${pct.toFixed(2)}%`;
}
