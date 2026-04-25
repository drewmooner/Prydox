import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { fallback, http, webSocket } from "wagmi";
import { LITVM_RPC, LITVM_WS, litvmLiteforge } from "./chain";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ||
  "prydox-dev-project-id";

export const wagmiConfig = getDefaultConfig({
  appName: "Prydox",
  appDescription: "Prydox lending and borrowing on LitVM",
  appUrl: "https://prydox.finance",
  projectId,
  chains: [litvmLiteforge],
  transports: {
    [litvmLiteforge.id]: fallback([webSocket(LITVM_WS), http(LITVM_RPC)]),
  },
  // Prevent render-time hydration state updates with App Router.
  ssr: true,
});
