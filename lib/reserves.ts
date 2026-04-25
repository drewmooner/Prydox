/** Lenders may supply only these reserves (matches product policy). */
export const ALLOWED_RESERVE_SYMBOLS = new Set(["USDC", "LTC", "WETH", "ZKLTC"]);

export function isAllowedReserveSymbol(symbol: string): boolean {
  return ALLOWED_RESERVE_SYMBOLS.has(symbol.trim().toUpperCase());
}
