import { parseUnits } from "viem";

/** Parse a user amount string to wei; returns null if invalid or non-positive. */
export function parseDecimalToWei(
  raw: string,
  decimals: number,
): bigint | null {
  const t = raw.trim().replaceAll(",", "");
  if (!t) return null;
  if (!/^\d*\.?\d*$/.test(t)) return null;
  try {
    const v = parseUnits(t as `${string}`, decimals);
    return v > BigInt(0) ? v : null;
  } catch {
    return null;
  }
}
