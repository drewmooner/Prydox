/**
 * Deploy PrydoxTestMintUSDC — on-chain mint via drip(), no prior balance needed.
 *
 * Optional env: DRIP_USDC_AMOUNT (raw, default 1000e6), DRIP_COOLDOWN (seconds, default 3600)
 */
require("dotenv").config();

async function main() {
  const { ethers } = require("hardhat");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const dripRaw = process.env.DRIP_USDC_AMOUNT
    ? ethers.BigNumber.from(process.env.DRIP_USDC_AMOUNT.trim())
    : ethers.utils.parseUnits("1000", 6);

  const cooldown = process.env.DRIP_COOLDOWN
    ? parseInt(process.env.DRIP_COOLDOWN.trim(), 10)
    : 3600;

  const Factory = await ethers.getContractFactory("PrydoxTestMintUSDC");
  const token = await Factory.deploy(
    "Prydox Test USDC",
    "tUSDC",
    6,
    dripRaw,
    cooldown,
  );
  await token.deployed();

  console.log("");
  console.log("PrydoxTestMintUSDC:", token.address);
  console.log("drip amount (raw):", dripRaw.toString());
  console.log("cooldown (s):", cooldown);
  console.log("");
  console.log("# Add to root .env.local for the mint faucet UI:");
  console.log(`NEXT_PUBLIC_MINT_TEST_USDC=${token.address}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
