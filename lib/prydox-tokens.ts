/** Prydox supply receipt symbols (UI labels; on-chain names may differ). */
export const PRYDOX_P = {
  USDC: "pUSDC",
  LTC: "pZKLTC",
} as const;

export type PrydoxSupplyAsset = keyof typeof PRYDOX_P;
