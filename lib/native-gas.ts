import { formatUnits, parseEther } from "viem";

/**
 * Native zkLTC kept back when using "MAX" collateral so `depositETH` msg.value
 * does not consume the entire balance — the wallet still needs native token to pay gas.
 */
export const NATIVE_ZKLTC_GAS_BUFFER_WEI = parseEther("0.05");

/**
 * Soft minimum native balance before ERC-20 deposit flow (approve + supply = 2 txs).
 * LitVM gas is cheap; keep this low so small wallets can still deposit.
 */
export const MIN_NATIVE_SUGGESTED_FOR_ERC20_DEPOSIT_WEI = parseEther("0.0002");

export function maxSpendableNativeWei(balanceWei: bigint): bigint {
  return balanceWei > NATIVE_ZKLTC_GAS_BUFFER_WEI
    ? balanceWei - NATIVE_ZKLTC_GAS_BUFFER_WEI
    : BigInt(0);
}

export function formatNativeAmountHuman(wei: bigint, maxFrac = 6): string {
  const n = Number(formatUnits(wei, 18));
  if (!Number.isFinite(n) || n <= 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}
