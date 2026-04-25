/**
 * Deploy three ManualAggregatorFeed contracts on LitVM (8-decimal USD-style answers).
 * Set printed LITVM_FEED_* in contracts/.env, then PRYDOX_LITVM_PRODUCTION=true and npm run deploy:litvm.
 *
 * Optional env (defaults are rough USD test values, 8 decimals):
 *   LITVM_INITIAL_PRICE_USDC  — default 100000000 ($1)
 *   LITVM_INITIAL_PRICE_LTC   — default 9000000000 ($90)
 *   LITVM_INITIAL_PRICE_ZKLT  — default 100000000 ($1); adjust to your peg
 */
require("dotenv").config();

async function main() {
  const { ethers, network } = require("hardhat");

  if (network.name !== "litvmLiteforge") {
    console.warn(`Warning: network is "${network.name}", expected litvmLiteforge.`);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const def = (name, fallback) => {
    const v = process.env[name];
    if (v && v.trim()) return v.trim();
    return fallback;
  };

  const pUsdc = def("LITVM_INITIAL_PRICE_USDC", "100000000");
  const pLtc = def("LITVM_INITIAL_PRICE_LTC", "9000000000");
  const pZklt = def("LITVM_INITIAL_PRICE_ZKLT", "100000000");

  const Factory = await ethers.getContractFactory("ManualAggregatorFeed");

  const feedUsdc = await Factory.deploy(pUsdc);
  await feedUsdc.deployed();
  const feedLtc = await Factory.deploy(pLtc);
  await feedLtc.deployed();
  const feedZklt = await Factory.deploy(pZklt);
  await feedZklt.deployed();

  console.log("");
  console.log("# Add these to contracts/.env (8-decimal Chainlink-style answers)");
  console.log(`LITVM_FEED_USDC=${feedUsdc.address}`);
  console.log(`LITVM_FEED_LTC=${feedLtc.address}`);
  console.log(`LITVM_FEED_ZKLT=${feedZklt.address}`);
  console.log("");
  console.log("Owner (can call updateAnswer on each feed):", deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
