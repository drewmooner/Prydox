import { defineChain } from "viem";

export const LITVM_RPC =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_LITVM_RPC_URL?.trim()) ||
  "https://liteforge.rpc.caldera.xyz/http";
export const LITVM_WS =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_LITVM_WS_URL?.trim()) ||
  "wss://liteforge.rpc.caldera.xyz/ws";

/** LitVM LiteForge — chain id 4441 */
export const litvmLiteforge = defineChain({
  id: 4441,
  name: "LitVM LiteForge",
  nativeCurrency: {
    decimals: 18,
    name: "zkLTC",
    symbol: "zkLTC",
  },
  rpcUrls: {
    default: { http: [LITVM_RPC], webSocket: [LITVM_WS] },
  },
  blockExplorers: {
    default: {
      name: "Caldera",
      url: "https://liteforge.explorer.caldera.xyz",
    },
  },
});
