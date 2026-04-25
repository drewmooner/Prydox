import type { PublicClient } from "viem";
import { parseGwei } from "viem";

/**
 * LitVM RPCs can return broken fee / gas estimates so wallets show huge fees and
 * reject with "fee exceeds configured cap". We pass conservative caps and
 * explicit gas limits on each write.
 */

export const LITVM_GAS_HARD_CAP = BigInt(30_000_000);

function bigMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

function bigMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export function litvmConservativeEip1559() {
  return {
    maxFeePerGas: parseGwei("0.5"),
    maxPriorityFeePerGas: parseGwei("0.1"),
  };
}

/**
 * EIP-1559: `maxFeePerGas` must be high enough for `baseFee + priority` or the
 * tx is invalid and wallets show opaque "unknown reason" on simulation.
 * We keep a floor (cheap networks) and raise toward base fee when needed, with a ceiling.
 */
export async function litvmFeeOverrides(client: PublicClient) {
  const priority = parseGwei("0.1");
  const floor = parseGwei("0.5");
  const ceiling = parseGwei("10");

  try {
    const block = await client.getBlock({ blockTag: "latest" });
    if (block.baseFeePerGas != null && block.baseFeePerGas > BigInt(0)) {
      const minNeeded = block.baseFeePerGas + priority;
      const maxFeePerGas = bigMin(ceiling, bigMax(floor, minNeeded));
      return {
        maxFeePerGas,
        maxPriorityFeePerGas: priority,
      };
    }
  } catch {
    /* fall through */
  }
  return { gasPrice: parseGwei("0.5") };
}

export function clampGasEstimate(estimated: bigint, fallback: bigint): bigint {
  const zero = BigInt(0);
  if (estimated <= zero || estimated > LITVM_GAS_HARD_CAP) return fallback;
  const bumped = (estimated * BigInt(120)) / BigInt(100);
  return bumped > LITVM_GAS_HARD_CAP ? LITVM_GAS_HARD_CAP : bumped;
}
