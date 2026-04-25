/**
 * Deploy PrydoxFaucet on LitVM: drips test USDC + native zkLTC from a funded pool.
 *
 * Env:
 *   LITVM_TOKEN_USDC — USDC reserve address (6 decimals typical)
 *   FAUCET_DRIP_USDC — raw USDC amount in token wei (default 100e6)
 *   FAUCET_DRIP_NATIVE — wei of zkLTC per drip (default 0.05 ether)
 *   FAUCET_COOLDOWN — seconds between drips per address (default 21600 = 6h)
 *
 * After deploy: fund the contract — send zkLTC to the faucet address, then either:
 *   - approve + call fundUsdc from an address holding USDC, or
 *   - npm run fund:prydox-faucet (if added)
 */
require("dotenv").config();

async function main() {
  const { ethers, network } = require("hardhat");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const usdcAddr =
    process.env.LITVM_TOKEN_USDC?.trim() ||
    "0x94f3BF60D0FDD920467815570B78a2F494D92566";

  const dripUsdc = process.env.FAUCET_DRIP_USDC
    ? ethers.BigNumber.from(process.env.FAUCET_DRIP_USDC.trim())
    : ethers.utils.parseUnits("100", 6);

  const dripNative = process.env.FAUCET_DRIP_NATIVE
    ? ethers.BigNumber.from(process.env.FAUCET_DRIP_NATIVE.trim())
    : ethers.utils.parseEther("0.05");

  const cooldown = process.env.FAUCET_COOLDOWN
    ? parseInt(process.env.FAUCET_COOLDOWN.trim(), 10)
    : 6 * 60 * 60;

  const Factory = await ethers.getContractFactory("PrydoxFaucet");
  const faucet = await Factory.deploy(
    usdcAddr,
    dripUsdc,
    dripNative,
    cooldown,
    deployer.address,
  );
  await faucet.deployed();

  console.log("");
  console.log("PrydoxFaucet:", faucet.address);
  console.log("USDC token:", usdcAddr);
  console.log("dripUsdc (raw):", dripUsdc.toString());
  console.log("dripNative (wei):", dripNative.toString());
  console.log("cooldown (seconds):", cooldown);
  console.log("");
  console.log("# Add to contracts/.env and root .env.local:");
  console.log(`LITVM_FAUCET=${faucet.address}`);
  console.log(`NEXT_PUBLIC_FAUCET=${faucet.address}`);
  console.log("");
  console.log("Fund: send zkLTC to the faucet contract; approve USDC then faucet.fundUsdc(amount).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
