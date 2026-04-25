/**
 * LitVM LiteForge (4441) + Prydox deployment addresses.
 * Override via root `.env.local` (see `.env.example`).
 */
export const prydoxConfig = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 4441),
  name: "LitVM LiteForge",
  rpcUrl:
    process.env.NEXT_PUBLIC_LITVM_RPC_URL ??
    "https://liteforge.rpc.caldera.xyz/http",
  explorer: "https://liteforge.explorer.caldera.xyz",
  /** Public docs — override with `NEXT_PUBLIC_DOCS_URL`. */
  docsUrl:
    process.env.NEXT_PUBLIC_DOCS_URL?.trim() ?? "https://prydox.finance/docs",
  poolAddressesProvider:
    process.env.NEXT_PUBLIC_POOL_ADDRESSES_PROVIDER ??
    "0xC06bbE937132B557456BfDbef7c742cb0f063b5E",
  pool:
    process.env.NEXT_PUBLIC_POOL ??
    "0x8Dc1Fb3CDFF5514c606F56cb343f89c6D7A8b878",
  oracle:
    process.env.NEXT_PUBLIC_ORACLE ?? "0x7253811444017445c27F68269eC56277B5B0462C",
  poolDataProvider:
    process.env.NEXT_PUBLIC_POOL_DATA_PROVIDER ??
    "0xA172648B1796d59537f9772286937b3400a6AF03",
  /** WrappedTokenGatewayV3 — native zkLTC → pool (depositETH) */
  wrappedTokenGateway:
    process.env.NEXT_PUBLIC_WRAPPED_TOKEN_GATEWAY?.trim() ??
    "0xEBD295eAbfF0E3F98Ba421CA9399bBa6EFf194EF",
  tokens: {
    /** Underlying ERC-20s: wallet UI + approve/supply/withdraw/repay all use these addresses (`NEXT_PUBLIC_TOKEN_*`). */
    USDC:
      process.env.NEXT_PUBLIC_TOKEN_USDC ??
      "0xe1b51EfB42cC9748C8ecf1129705F5d27901261a",
    LTC:
      process.env.NEXT_PUBLIC_TOKEN_LTC ??
      "0x6D91307931a77C897D544A5E698cb1eA18009f32",
    ZKLT:
      process.env.NEXT_PUBLIC_TOKEN_ZKLT ??
      "0x571b17015e46612D882b50aafC58A1b5E6b3D63a",
  },
  feeds: {
    USDC:
      process.env.NEXT_PUBLIC_FEED_USDC ??
      "0xb0f3cFABe04d838EDAC4272c6B4647c693CdA5Fd",
    LTC:
      process.env.NEXT_PUBLIC_FEED_LTC ??
      "0xD3a7687364bDE392E4365c043c599042708CDDB5",
    ZKLT:
      process.env.NEXT_PUBLIC_FEED_ZKLT ??
      "0xD3a7687364bDE392E4365c043c599042708CDDB5",
  },
} as const;

export function explorerAddress(addr: string) {
  return `${prydoxConfig.explorer}/address/${addr}`;
}
