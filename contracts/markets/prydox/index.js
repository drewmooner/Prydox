"use strict";
/**
 * Prydox pool configuration for @aave/deploy-v3 (MARKET_NAME=Prydox).
 * Reserve asset addresses are filled at deploy time from testnet token deploys when TestnetMarket is true.
 */
const { ZERO_ADDRESS } = require("@aave/deploy-v3/dist/helpers/constants");
const { eEthereumNetwork } = require("@aave/deploy-v3/dist/helpers/types");
const { CommonsConfig } = require("./commons");
const {
  strategyUSDC,
  strategyLTC,
  strategyZKLT,
} = require("./reservesConfigs");
const env = require("./env");

const litvmTokens = env.getLitvmTokenAddresses();

exports.PrydoxMarket = {
  ...CommonsConfig,
  MarketId: "Prydox LitVM Market",
  ProviderId: 9091,
  ReservesConfig: {
    USDC: strategyUSDC,
    LTC: strategyLTC,
    ZKLT: strategyZKLT,
  },
  ReserveAssets: {
    [eEthereumNetwork.main]: {
      USDC: ZERO_ADDRESS,
      LTC: ZERO_ADDRESS,
      ZKLT: ZERO_ADDRESS,
    },
    [eEthereumNetwork.hardhat]: {
      USDC: ZERO_ADDRESS,
      LTC: ZERO_ADDRESS,
      ZKLT: ZERO_ADDRESS,
    },
    litvmLiteforge: litvmTokens || {
      USDC: ZERO_ADDRESS,
      LTC: ZERO_ADDRESS,
      ZKLT: ZERO_ADDRESS,
    },
  },
};

exports.default = exports.PrydoxMarket;
