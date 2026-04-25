"use strict";
/**
 * Prydox global market parameters.
 * - ProtocolName + ReceiptTokenSymbolPrefix: patched init-helpers (pUSDC, pLTC, pZKLT).
 * - TestnetMarket: false when PRYDOX_LITVM_PRODUCTION=true → no mock aggregators; real feeds + real tokens from .env.
 * - WrappedNativeTokenSymbol: WETH for local Hardhat mocks; use LitVM native wrapper when you wire it.
 */
const { ZERO_ADDRESS } = require("@aave/deploy-v3/dist/helpers/constants");
const { eEthereumNetwork } = require("@aave/deploy-v3/dist/helpers/types");
const {
  rateStrategyVolatileOne,
  rateStrategyStableOne,
  rateStrategyStableTwo,
} = require("./rateStrategies");
const env = require("./env");

const LITVM_NETWORK = "litvmLiteforge";

const litvmFeeds = env.getLitvmFeedAddresses();

exports.CommonsConfig = {
  MarketId: "Prydox LitVM Market",
  /** Display name used in token full names (replaces default "Aave"). */
  ProtocolName: "Prydox",
  /** Receipt tokens: p + reserve symbol (pUSDC, pLTC, pZKLT). Set null to use default Aave "a" + SymbolPrefix + symbol. */
  ReceiptTokenSymbolPrefix: "p",

  ATokenNamePrefix: "",
  StableDebtTokenNamePrefix: "Prydox",
  VariableDebtTokenNamePrefix: "Prydox",
  SymbolPrefix: "",

  ProviderId: 9091,
  /** false on LitVM when using real oracles + canonical tokens (see markets/prydox/env.js). */
  TestnetMarket: !env.isLitvmProduction(),

  OracleQuoteCurrencyAddress: ZERO_ADDRESS,
  OracleQuoteCurrency: "USD",
  OracleQuoteUnit: "8",

  WrappedNativeTokenSymbol: "WETH",

  ChainlinkAggregator: {
    [eEthereumNetwork.main]: {
      USDC: ZERO_ADDRESS,
      LTC: ZERO_ADDRESS,
      ZKLT: ZERO_ADDRESS,
    },
    ...(litvmFeeds ? { [LITVM_NETWORK]: litvmFeeds } : {}),
  },

  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [LITVM_NETWORK]: ZERO_ADDRESS,
  },

  FallbackOracle: {
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [LITVM_NETWORK]: ZERO_ADDRESS,
  },

  ReservesConfig: {},

  IncentivesConfig: {
    enabled: {
      [eEthereumNetwork.hardhat]: false,
      [LITVM_NETWORK]: false,
    },
    rewards: {
      [eEthereumNetwork.hardhat]: {},
      [LITVM_NETWORK]: {},
    },
    rewardsOracle: {
      [eEthereumNetwork.hardhat]: {},
      [LITVM_NETWORK]: {},
    },
    incentivesInput: {
      [eEthereumNetwork.hardhat]: [],
      [LITVM_NETWORK]: [],
    },
  },

  EModes: {
    PrydoxStable: {
      id: "1",
      ltv: "9800",
      liquidationThreshold: "9850",
      liquidationBonus: "10100",
      label: "Prydox-Stables",
      assets: ["USDC"],
    },
  },

  FlashLoanPremiums: {
    total: 0.0009e4,
    protocol: 0,
  },

  RateStrategies: {
    rateStrategyVolatileOne,
    rateStrategyStableOne,
    rateStrategyStableTwo,
  },
};
