# Prydox price feeds (LitVM) — p2p-oracle–style relay

This matches the idea from [Peer2Pepu/p2p-oracle](https://github.com/Peer2Pepu/p2p-oracle): **no full Chainlink network on LitVM**, so we keep **Chainlink-shaped contracts** on LitVM and an **off-chain relayer** that pushes prices from a chain that has Chainlink (default: **Base mainnet**).

## On-chain: `ManualAggregatorFeed`

- File: `src/oracles/ManualAggregatorFeed.sol`
- Exposes **`decimals()`** (8) and **`latestRoundData()`** so the Prydox app (`useBorrowEligibility`, etc.) and Aave-style tooling work.
- Owner calls **`updateAnswer(int256)`** with the 8-decimal USD price (same scale as Chainlink USD feeds).

Deploy three feeds (USDC/USD, LTC/USD, ZKLT/USD) and put addresses in `contracts/.env` as `LITVM_FEED_USDC`, `LITVM_FEED_LTC`, `LITVM_FEED_ZKLT`, then mirror into the Next app as `NEXT_PUBLIC_FEED_*`.

```bash
cd contracts
npm run deploy:litvm-feeds
```

> **Already deployed old feeds?** Earlier bytecode had only `latestAnswer`, not `latestRoundData`. Redeploy feeds and update env addresses so the UI can read prices on-chain.

## Off-chain relayer

- Script: `scripts/update-litvm-feeds-from-chainlink.js`
- Reads Chainlink `latestRoundData` + `decimals` on the **source** RPC, scales to **8 decimals**, then calls **`updateAnswer`** on each LitVM feed.

```bash
cd contracts
npm run update:litvm-feeds-chainlink
```

Requires in `contracts/.env`:

- `DEPLOYER_PRIVATE_KEY` — same key that owns the feeds (must be feed owner).
- `LITVM_RPC_URL` — LitVM RPC (default matches LiteForge).
- `LITVM_FEED_USDC`, `LITVM_FEED_LTC`, `LITVM_FEED_ZKLT` — deployed feed addresses.

Optional overrides:

- `CHAINLINK_RPC_URL` — default `https://mainnet.base.org`
- `CHAINLINK_FEED_USDC`, `CHAINLINK_FEED_LTC`, `CHAINLINK_FEED_ZKLT` — source Chainlink aggregator addresses on that RPC’s chain (defaults are Base mainnet USDC/USD and LTC/USD).

## Frontend

`NEXT_PUBLIC_FEED_USDC` / `NEXT_PUBLIC_FEED_LTC` in the **root** `.env.local` must point to the same LitVM feed contracts the relayer updates.
