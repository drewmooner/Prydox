/* eslint-disable no-console */
require("dotenv").config();
const hre = require("hardhat");

const POOL_ADDRESSES_PROVIDER_ABI = [
  "function getPoolConfigurator() view returns (address)",
];
const POOL_CONFIGURATOR_ABI = [
  "function initReserves(tuple(address aTokenImpl,address stableDebtTokenImpl,address variableDebtTokenImpl,uint8 underlyingAssetDecimals,address interestRateStrategyAddress,address underlyingAsset,address treasury,address incentivesController,string aTokenName,string aTokenSymbol,string variableDebtTokenName,string variableDebtTokenSymbol,string stableDebtTokenName,string stableDebtTokenSymbol,bytes params)[])",
  "function setReserveActive(address asset, bool active)",
  "function setReserveFreeze(address asset, bool freeze)",
  "function configureReserveAsCollateral(address asset, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus)",
];
const POOL_DATA_PROVIDER_ABI = [
  "function getReserveConfigurationData(address asset) view returns (uint256,uint256,uint256,uint256,uint256,bool,bool,bool,bool,bool)",
  "function getReserveTokensAddresses(address asset) view returns (address,address,address)",
];
const WRAPPED_GATEWAY_ABI = ["function getWETHAddress() view returns (address)"];

const DEFAULT_POOL_ADDRESSES_PROVIDER =
  process.env.NEXT_PUBLIC_POOL_ADDRESSES_PROVIDER ||
  "0xB10BA4c4d1A0b4b092550325C0fD30E2aaC9840F";
const DEFAULT_POOL_DATA_PROVIDER =
  process.env.NEXT_PUBLIC_POOL_DATA_PROVIDER ||
  "0xFbb0e62504E7ff80babf0ff25fb6026a0797bb9E";
const DEFAULT_WRAPPED_GATEWAY =
  process.env.NEXT_PUBLIC_WRAPPED_TOKEN_GATEWAY ||
  "0x0AA5a605Ab587c4dbfa3179225b7c9ca86678968";

const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  if (!signer) throw new Error("No signer available. Set DEPLOYER_PRIVATE_KEY.");

  const providerAddr =
    process.env.POOL_ADDRESSES_PROVIDER || DEFAULT_POOL_ADDRESSES_PROVIDER;
  const dataProviderAddr =
    process.env.POOL_DATA_PROVIDER || DEFAULT_POOL_DATA_PROVIDER;
  const gatewayAddr = process.env.WRAPPED_GATEWAY || DEFAULT_WRAPPED_GATEWAY;

  const ltv = Number(process.env.NATIVE_LTV_BPS || "7000");
  const liqThreshold = Number(process.env.NATIVE_LIQ_THRESHOLD_BPS || "8000");
  const liqBonus = Number(process.env.NATIVE_LIQ_BONUS_BPS || "10500");

  console.log("Admin:", signer.address);
  console.log("PoolAddressesProvider:", providerAddr);
  console.log("PoolDataProvider:", dataProviderAddr);
  console.log("WrappedTokenGateway:", gatewayAddr);
  console.log(
    `Collateral params (bps) => ltv=${ltv}, liqThreshold=${liqThreshold}, liqBonus=${liqBonus}`,
  );

  const provider = new hre.ethers.Contract(
    providerAddr,
    POOL_ADDRESSES_PROVIDER_ABI,
    signer,
  );
  const dataProvider = new hre.ethers.Contract(
    dataProviderAddr,
    POOL_DATA_PROVIDER_ABI,
    signer,
  );
  const gateway = new hre.ethers.Contract(gatewayAddr, WRAPPED_GATEWAY_ABI, signer);

  const configuratorAddr = await provider.getPoolConfigurator();
  const configurator = new hre.ethers.Contract(
    configuratorAddr,
    POOL_CONFIGURATOR_ABI,
    signer,
  );
  console.log("PoolConfigurator:", configuratorAddr);

  const weth = await gateway.getWETHAddress();
  console.log("Gateway WETH reserve:", weth);

  const before = await dataProvider.getReserveConfigurationData(weth);
  const tokensBefore = await dataProvider.getReserveTokensAddresses(weth);
  console.log("Before:", {
    ltv: Number(before[1]),
    liqThreshold: Number(before[2]),
    liqBonus: Number(before[3]),
    usageAsCollateralEnabled: Boolean(before[5]),
    isActive: Boolean(before[8]),
    isFrozen: Boolean(before[9]),
    aToken: tokensBefore[0],
  });

  const isListed = tokensBefore[0].toLowerCase() !== ZERO;
  if (!isListed) {
    const aTokenImpl = require("../deployments/litvmLiteforge/AToken-Prydox.json").address;
    const stableDebtImpl = require("../deployments/litvmLiteforge/StableDebtToken-Prydox.json").address;
    const variableDebtImpl = require("../deployments/litvmLiteforge/VariableDebtToken-Prydox.json").address;
    const strategy = require("../deployments/litvmLiteforge/ReserveStrategy-rateStrategyVolatileOne.json").address;
    const treasury = require("../deployments/litvmLiteforge/TreasuryProxy.json").address;
    const incentivesController = require("../deployments/litvmLiteforge/IncentivesProxy.json").address;

    const initInput = [
      {
        aTokenImpl,
        stableDebtTokenImpl: stableDebtImpl,
        variableDebtTokenImpl: variableDebtImpl,
        underlyingAssetDecimals: 18,
        interestRateStrategyAddress: strategy,
        underlyingAsset: weth,
        treasury,
        incentivesController,
        aTokenName: "Prydox WETH",
        aTokenSymbol: "pWETH",
        variableDebtTokenName: "Prydox Variable Debt WETH",
        variableDebtTokenSymbol: "vdWETH",
        stableDebtTokenName: "Prydox Stable Debt WETH",
        stableDebtTokenSymbol: "sdWETH",
        params: "0x",
      },
    ];
    const tx = await configurator.initReserves(initInput);
    console.log("initReserves tx:", tx.hash);
    await tx.wait();
  } else {
    console.log("Reserve already listed.");
  }

  if (!before[8]) {
    const tx = await configurator.setReserveActive(weth, true);
    console.log("setReserveActive tx:", tx.hash);
    await tx.wait();
  } else {
    console.log("Reserve already active.");
  }

  if (before[9]) {
    const tx = await configurator.setReserveFreeze(weth, false);
    console.log("setReserveFreeze(false) tx:", tx.hash);
    await tx.wait();
  } else {
    console.log("Reserve already unfrozen.");
  }

  const tx = await configurator.configureReserveAsCollateral(
    weth,
    ltv,
    liqThreshold,
    liqBonus,
  );
  console.log("configureReserveAsCollateral tx:", tx.hash);
  await tx.wait();

  const after = await dataProvider.getReserveConfigurationData(weth);
  const tokensAfter = await dataProvider.getReserveTokensAddresses(weth);
  console.log("After:", {
    ltv: Number(after[1]),
    liqThreshold: Number(after[2]),
    liqBonus: Number(after[3]),
    usageAsCollateralEnabled: Boolean(after[5]),
    isActive: Boolean(after[8]),
    isFrozen: Boolean(after[9]),
    aToken: tokensAfter[0],
  });

  if (!after[8] || !after[5] || after[9]) {
    throw new Error("Reserve state still not usable as native collateral.");
  }
  console.log("Native WETH reserve is enabled for collateral.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
