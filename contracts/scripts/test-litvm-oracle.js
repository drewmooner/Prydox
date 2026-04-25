/**
 * Read AaveOracle.getAssetPrice for each reserve + ManualAggregatorFeed.latestAnswer.
 * Requires contracts/.env with LITVM_RPC_URL, LITVM_TOKEN_*, LITVM_FEED_* (same as deploy).
 *
 * Usage: npm run test:litvm-oracle
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { ethers } = require("ethers");

const ORACLE_ABI = [
  "function getAssetPrice(address asset) view returns (uint256)",
  "function BASE_CURRENCY_UNIT() view returns (uint256)",
];
const AGG_ABI = ["function latestAnswer() view returns (int256)"];

function loadOracleAddress() {
  const envAddr = process.env.LITVM_AAVE_ORACLE;
  if (envAddr && /^0x[a-fA-F0-9]{40}$/.test(envAddr.trim())) {
    return envAddr.trim();
  }
  const p = path.join(
    __dirname,
    "..",
    "deployments",
    "litvmLiteforge",
    "AaveOracle-Prydox.json"
  );
  if (!fs.existsSync(p)) {
    throw new Error(`Missing ${p} — deploy first or set LITVM_AAVE_ORACLE in .env`);
  }
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  return j.address;
}

async function main() {
  const rpc = process.env.LITVM_RPC_URL || "https://liteforge.rpc.caldera.xyz/http";
  const provider = new ethers.providers.JsonRpcProvider(rpc);

  const oracleAddr = loadOracleAddress();
  const oracle = new ethers.Contract(oracleAddr, ORACLE_ABI, provider);

  let baseUnit;
  try {
    baseUnit = await oracle.BASE_CURRENCY_UNIT();
  } catch {
    baseUnit = null;
  }

  console.log("RPC:", rpc);
  console.log("AaveOracle:", oracleAddr);
  if (baseUnit) console.log("BASE_CURRENCY_UNIT:", baseUnit.toString());
  console.log("");

  const symbols = ["USDC", "LTC", "ZKLT"];
  for (const sym of symbols) {
    const token = process.env[`LITVM_TOKEN_${sym}`];
    const feed = process.env[`LITVM_FEED_${sym}`];
    if (!token) {
      console.log(`${sym}: (no LITVM_TOKEN_${sym} in .env)`);
      continue;
    }
    const p = await oracle.getAssetPrice(token);
    console.log(`AaveOracle.getAssetPrice(${sym}): ${p.toString()}`);
    if (feed) {
      const agg = new ethers.Contract(feed, AGG_ABI, provider);
      const a = await agg.latestAnswer();
      console.log(`  ManualAggregatorFeed.latestAnswer: ${a.toString()} (should match oracle raw price)`);
    }
    console.log("");
  }

  console.log(
    "Prices use the same scale as your feeds (typically 8 decimals = USD with 1e8).",
    "After npm run update:litvm-feeds-chainlink, rerun this script to see new numbers."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
