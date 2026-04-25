/**
 * Seed PrydoxFaucet with USDC (approve + fundUsdc) + native zkLTC (send).
 *
 * Requires contracts/.env: DEPLOYER_PRIVATE_KEY, LITVM_RPC_URL, LITVM_FAUCET, LITVM_TOKEN_USDC
 * Optional: FAUCET_SEED_USDC (raw, default 50000e6), FAUCET_SEED_NATIVE (wei, default 2 ether)
 */
require("dotenv").config();

const { ethers } = require("ethers");

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const FAUCET_ABI = [
  "function fundUsdc(uint256 amount) external",
  "function usdc() view returns (address)",
];

function requirePk() {
  let v = process.env.DEPLOYER_PRIVATE_KEY;
  if (!v || !String(v).trim()) throw new Error("DEPLOYER_PRIVATE_KEY");
  v = String(v).trim();
  if (!v.startsWith("0x")) v = `0x${v}`;
  return v;
}

function requireAddr(name) {
  const v = process.env[name];
  if (!v || !/^0x[a-fA-F0-9]{40}$/i.test(v.trim())) {
    throw new Error(`Missing or invalid ${name}`);
  }
  return v.trim();
}

async function main() {
  const rpc = process.env.LITVM_RPC_URL || "https://liteforge.rpc.caldera.xyz/http";
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(requirePk(), provider);

  const faucetAddr = requireAddr("LITVM_FAUCET");
  const tokenAddr = requireAddr("LITVM_TOKEN_USDC");

  const seedUsdc = process.env.FAUCET_SEED_USDC
    ? ethers.BigNumber.from(process.env.FAUCET_SEED_USDC.trim())
    : ethers.utils.parseUnits("50000", 6);

  const seedNative = process.env.FAUCET_SEED_NATIVE
    ? ethers.BigNumber.from(process.env.FAUCET_SEED_NATIVE.trim())
    : ethers.utils.parseEther("2");

  const token = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
  const faucet = new ethers.Contract(faucetAddr, FAUCET_ABI, wallet);

  const onChainUsdc = await faucet.usdc();
  if (onChainUsdc.toLowerCase() !== tokenAddr.toLowerCase()) {
    throw new Error(`Faucet.usdc ${onChainUsdc} != LITVM_TOKEN_USDC ${tokenAddr}`);
  }

  const bal = await token.balanceOf(wallet.address);
  console.log("Deployer USDC balance:", bal.toString());
  if (seedUsdc.isZero()) {
    console.log("FAUCET_SEED_USDC is 0 — skipping USDC fund.");
  } else if (bal.lt(seedUsdc)) {
    console.warn("Not enough USDC to seed; skipping fundUsdc (need", seedUsdc.toString(), ")");
  } else {
    console.log("Approving USDC for faucet...");
    const tx1 = await token.approve(faucetAddr, seedUsdc);
    await tx1.wait();
    console.log("fundUsdc...");
    const tx2 = await faucet.fundUsdc(seedUsdc);
    await tx2.wait();
    console.log("USDC funded:", seedUsdc.toString());
  }

  const ethBal = await provider.getBalance(wallet.address);
  console.log("Deployer zkLTC balance (wei):", ethBal.toString());
  if (ethBal.lt(seedNative)) {
    console.warn("Not enough native zkLTC to seed; send zkLTC to faucet manually:", faucetAddr);
  } else {
    console.log("Sending zkLTC to faucet...");
    const tx3 = await wallet.sendTransaction({
      to: faucetAddr,
      value: seedNative,
    });
    await tx3.wait();
    console.log("Native funded:", seedNative.toString());
  }

  console.log("Faucet address:", faucetAddr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
