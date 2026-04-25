"use client";

const KEY_PREFIX = "prydox:failed-borrow-collateral-wei:";

function keyFor(address: `0x${string}`): string {
  return `${KEY_PREFIX}${address.toLowerCase()}`;
}

export function getFailedBorrowCollateralWei(address: `0x${string}`): bigint {
  if (typeof window === "undefined") return BigInt(0);
  try {
    const raw = window.localStorage.getItem(keyFor(address));
    if (!raw) return BigInt(0);
    const v = BigInt(raw);
    return v > BigInt(0) ? v : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

export function addFailedBorrowCollateralWei(
  address: `0x${string}`,
  delta: bigint,
): bigint {
  const safeDelta = delta > BigInt(0) ? delta : BigInt(0);
  const next = getFailedBorrowCollateralWei(address) + safeDelta;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(keyFor(address), next.toString());
  }
  return next;
}

export function reduceFailedBorrowCollateralWei(
  address: `0x${string}`,
  delta: bigint,
): bigint {
  const safeDelta = delta > BigInt(0) ? delta : BigInt(0);
  const prev = getFailedBorrowCollateralWei(address);
  const next = prev > safeDelta ? prev - safeDelta : BigInt(0);
  if (typeof window !== "undefined") {
    if (next > BigInt(0)) {
      window.localStorage.setItem(keyFor(address), next.toString());
    } else {
      window.localStorage.removeItem(keyFor(address));
    }
  }
  return next;
}

export function clearFailedBorrowCollateralWei(address: `0x${string}`): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyFor(address));
}
