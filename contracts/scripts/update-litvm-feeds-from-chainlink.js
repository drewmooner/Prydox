/**
 * Read Chainlink Data Feeds (AggregatorV3) on a **reference chain** (default: Base mainnet),
 * scale answers to 8 decimals, then call `updateAnswer` on Prydox `ManualAggregatorFeed` on LitVM.
 *
 * Feeds + RPC must be on the **same** network. Override with CHAINLINK_RPC_URL + CHAINLINK_FEED_*.
 *
 * Usage: npm run update:litvm-feeds-chainlink
 * Requires: DEPLOYER_PRIVATE_KEY, LITVM_RPC_URL, LITVM_FEED_USDC, LITVM_FEED_LTC, LITVM_FEED_ZKLT
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { ethers } = require("ethers");

const AGG_V3_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() external view returns (uint8)",
];

const MANUAL_FEED_ABI = ["function updateAnswer(int256 newAnswer) external"];

/** Base mainnet — USDC/USD + LTC/USD (same chain). https://data.chain.link/ */
const DEFAULT_CHAINLINK_RPC = "https://mainnet.base.org";
const DEFAULT_FEED_USDC_BASE = "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B";
const DEFAULT_FEED_LTC_BASE = "0x206a34e47093125fbf4C75b7c7E88b84c6A77a69";

const TARGET_DECIMALS = 8;

function requireAddr(name) {
  const v = process.env[name];
  if (!v || !/^0x[a-fA-F0-9]{40}$/.test(v.trim())) {
    throw new Error(`Missing or invalid ${name} in contracts/.env`);
  }
  return v.trim();
}

/** 32-byte hex private key (with or without 0x). Do not use the address regex for this. */
function requirePrivateKey(name) {
  let v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing ${name} in contracts/.env`);
  }
  v = String(v).trim();
  if (!v.startsWith("0x")) v = `0x${v}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(v)) {
    throw new Error(`Invalid ${name} (expected 64 hex chars, 32 bytes)`);
  }
  return v;
}

function optionalAddr(name, fallback) {
  const v = process.env[name];
  if (v && /^0x[a-fA-F0-9]{40}$/.test(v.trim())) return v.trim();
  return fallback;
}

/**
 * @param {ethers.BigNumber} answer raw Chainlink `answer`
 * @param {ethers.BigNumber|number} feedDecimals from `decimals()`
 * @returns {ethers.BigNumber} scaled to 8 decimals (Aave / ManualAggregatorFeed convention)
 */
function toEightDecimals(answer, feedDecimals) {
  const fd =
    typeof feedDecimals === "number"
      ? feedDecimals
      : feedDecimals.toNumber
        ? feedDecimals.toNumber()
        : feedDecimals.toString();
  const fdNum = typeof fd === "string" ? parseInt(fd, 10) : fd;
  if (fdNum === TARGET_DECIMALS) return answer;
  const num = ethers.BigNumber.from(10).pow(fdNum);
  const den = ethers.BigNumber.from(10).pow(TARGET_DECIMALS);
  return answer.mul(den).div(num);
}

async function readChainlinkPrice(provider, feedAddress) {
  const c = new ethers.Contract(feedAddress, AGG_V3_ABI, provider);
  const [, answer] = await c.latestRoundData();
  const d = await c.decimals();
  const scaled = toEightDecimals(answer, d);
  if (scaled.gt(ethers.constants.MaxInt256) || scaled.lt(ethers.constants.MinInt256)) {
    throw new Error(`Scaled price overflow for feed ${feedAddress}`);
  }
  return scaled;
}

async function main() {
  const chainlinkRpc = process.env.CHAINLINK_RPC_URL || DEFAULT_CHAINLINK_RPC;
  const feedUsdc = optionalAddr("CHAINLINK_FEED_USDC", DEFAULT_FEED_USDC_BASE);
  const feedLtc = optionalAddr("CHAINLINK_FEED_LTC", DEFAULT_FEED_LTC_BASE);
  /** ZKLT: no public Chainlink feed — default to LTC/USD (zkLTC narrative). */
  const feedZklt = optionalAddr("CHAINLINK_FEED_ZKLT", feedLtc);

  console.log("Chainlink RPC:", chainlinkRpc);
  console.log("Feeds USDC / LTC / ZKLT:", feedUsdc, feedLtc, feedZklt);

  const src = new ethers.providers.JsonRpcProvider(chainlinkRpc);

  const [pUsdc, pLtc, pZklt] = await Promise.all([
    readChainlinkPrice(src, feedUsdc),
    readChainlinkPrice(src, feedLtc),
    readChainlinkPrice(src, feedZklt),
  ]);

  console.log("Chainlink (8d) USDC:", pUsdc.toString(), "LTC:", pLtc.toString(), "ZKLT:", pZklt.toString());

  const pk = requirePrivateKey("DEPLOYER_PRIVATE_KEY");
  const litvmUrl = process.env.LITVM_RPC_URL || "https://liteforge.rpc.caldera.xyz/http";
  const litvm = new ethers.providers.JsonRpcProvider(litvmUrl);
  const wallet = new ethers.Wallet(pk.startsWith("0x") ? pk : `0x${pk}`, litvm);

  const destUsdc = requireAddr("LITVM_FEED_USDC");
  const destLtc = requireAddr("LITVM_FEED_LTC");
  const destZklt = requireAddr("LITVM_FEED_ZKLT");

  const txs = [
    { label: "USDC", c: new ethers.Contract(destUsdc, MANUAL_FEED_ABI, wallet), price: pUsdc },
    { label: "LTC", c: new ethers.Contract(destLtc, MANUAL_FEED_ABI, wallet), price: pLtc },
    { label: "ZKLT", c: new ethers.Contract(destZklt, MANUAL_FEED_ABI, wallet), price: pZklt },
  ];

  for (const { label, c, price } of txs) {
    const tx = await c.updateAnswer(price);
    console.log(`${label} updateAnswer tx:`, tx.hash);
    await tx.wait();
    console.log(`${label} confirmed`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
