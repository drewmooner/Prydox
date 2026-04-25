"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const market_config_helpers_1 = require("./../../helpers/market-config-helpers");
const constants_1 = require("../../helpers/constants");
const helpers_1 = require("../../helpers");
const env_1 = require("../../helpers/env");
const func = async function ({ getNamedAccounts, deployments, ...hre }) {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const network = (process.env.FORK ? process.env.FORK : hre.network.name);
    const poolConfig = (0, market_config_helpers_1.loadPoolConfig)(env_1.MARKET_NAME);
    let wrappedNativeTokenAddress;
    // Local networks that are not live or testnet, like hardhat network, will deploy a WETH9 contract as mockup for testing deployments
    if ((0, market_config_helpers_1.isTestnetMarket)(poolConfig)) {
        wrappedNativeTokenAddress = (await deployments.get(`${poolConfig.WrappedNativeTokenSymbol}${helpers_1.TESTNET_TOKEN_PREFIX}`)).address;
    }
    else {
        wrappedNativeTokenAddress = constants_1.WRAPPED_NATIVE_TOKEN_PER_NETWORK[network];
        const envW = process.env.LITVM_WRAPPED_NATIVE_TOKEN;
        if (envW && /^0x[a-fA-F0-9]{40}$/i.test(envW.trim())) {
            wrappedNativeTokenAddress = envW.trim();
        }
        if (!wrappedNativeTokenAddress) {
            console.log("[Prydox] No WRAPPED_NATIVE for this network — deploying WETH9Mock for WrappedTokenGateway (override with LITVM_WRAPPED_NATIVE_TOKEN in .env)");
            const sym = poolConfig.WrappedNativeTokenSymbol || "WETH";
            const mock = await deploy("WETH9Mock-PrydoxGateway", {
                from: deployer,
                contract: "WETH9Mock",
                args: [sym, sym, deployer],
                ...env_1.COMMON_DEPLOY_PARAMS,
            });
            wrappedNativeTokenAddress = mock.address;
        }
    }
    const { address: poolAddress } = await deployments.get(helpers_1.POOL_PROXY_ID);
    await deploy("WrappedTokenGatewayV3", {
        from: deployer,
        args: [wrappedNativeTokenAddress, deployer, poolAddress],
    });
};
func.tags = ["periphery-post", "WrappedTokenGateway"];
func.dependencies = [];
func.id = "WrappedTokenGateway";
exports.default = func;
