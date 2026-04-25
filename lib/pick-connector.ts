import type { Connector } from "wagmi";

/** Prefer MetaMask, then generic injected (Rabby, Coinbase extension, …). */
export function pickInjectedConnector(connectors: readonly Connector[]) {
  return (
    connectors.find((c) => c.id === "metaMask") ??
    connectors.find((c) => c.id === "injected") ??
    connectors[0]
  );
}
