"use strict";
/**
 * LitVM production mode: real ERC20s + Chainlink-compatible price feeds (AggregatorInterface).
 * Set PRYDOX_LITVM_PRODUCTION=true and fill LITVM_* addresses in contracts/.env
 *
 * Feeds must implement Chainlink's AggregatorV3Interface (latestRoundData, decimals, etc.)
 * — standard Chainlink on-chain feeds, or an adapter contract you deploy.
 */
function requireAddr(envName) {
  const v = process.env[envName];
  if (!v || !/^0x[a-fA-F0-9]{40}$/.test(v.trim())) {
    throw new Error(
      `[Prydox] Missing or invalid ${envName}. Set it in contracts/.env when PRYDOX_LITVM_PRODUCTION=true.`
    );
  }
  return v.trim();
}

exports.isLitvmProduction = function isLitvmProduction() {
  return process.env.PRYDOX_LITVM_PRODUCTION === "true";
};

exports.getLitvmTokenAddresses = function getLitvmTokenAddresses() {
  if (!exports.isLitvmProduction()) return null;
  return {
    USDC: requireAddr("LITVM_TOKEN_USDC"),
    LTC: requireAddr("LITVM_TOKEN_LTC"),
    ZKLT: requireAddr("LITVM_TOKEN_ZKLT"),
  };
};

exports.getLitvmFeedAddresses = function getLitvmFeedAddresses() {
  if (!exports.isLitvmProduction()) return null;
  return {
    USDC: requireAddr("LITVM_FEED_USDC"),
    LTC: requireAddr("LITVM_FEED_LTC"),
    ZKLT: requireAddr("LITVM_FEED_ZKLT"),
  };
};
