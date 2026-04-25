"use strict";
/**
 * Prydox reserves: USDC + LTC (supply/borrow), zkLTC-style collateral (supply + borrow USDC/LTC against it).
 * Receipt token symbols are set via ProtocolName + ReceiptTokenSymbolPrefix in commons (see patched init-helpers).
 */
const { eContractid } = require("@aave/deploy-v3/dist/helpers/types");
const {
  rateStrategyStableOne,
  rateStrategyVolatileOne,
} = require("./rateStrategies");

/** USDC — stable borrow/supply */
exports.strategyUSDC = {
  strategy: rateStrategyStableOne,
  baseLTVAsCollateral: "8000",
  liquidationThreshold: "8500",
  liquidationBonus: "10500",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "6",
  aTokenImpl: eContractid.AToken,
  reserveFactor: "1000",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: true,
};

/** LTC — volatile-style */
exports.strategyLTC = {
  strategy: rateStrategyVolatileOne,
  baseLTVAsCollateral: "7000",
  liquidationThreshold: "7500",
  liquidationBonus: "11000",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "8",
  aTokenImpl: eContractid.AToken,
  reserveFactor: "1500",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: false,
};

/**
 * zkLTC collateral reserve (ticker ZKLT → receipt symbol pZKLT; underlying zkLTC token wired at deploy).
 * Borrowing this asset disabled; borrow USDC/LTC against it.
 */
exports.strategyZKLT = {
  strategy: rateStrategyVolatileOne,
  baseLTVAsCollateral: "7500",
  liquidationThreshold: "8000",
  liquidationBonus: "10500",
  liquidationProtocolFee: "1000",
  borrowingEnabled: false,
  stableBorrowRateEnabled: false,
  flashLoanEnabled: true,
  reserveDecimals: "18",
  aTokenImpl: eContractid.AToken,
  reserveFactor: "0",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: false,
};
