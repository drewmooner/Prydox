"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../../helpers/env");
const deploy_ids_1 = require("../../helpers/deploy-ids");
const constants_1 = require("../../helpers/constants");
const helpers_1 = require("../../helpers");
const env_2 = require("../../helpers/env");
function isAlreadyInitializedError(e) {
    const errText = (e && (e.reason || e.message)) || (e && e.error && e.error.message) || String(e);
    return errText.includes("already been initialized");
}
const func = async function ({ getNamedAccounts, deployments, ...hre }) {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const { address: addressesProvider } = await deployments.get(deploy_ids_1.POOL_ADDRESSES_PROVIDER_ID);
    const addressesProviderInstance = (await (0, helpers_1.getContract)("PoolAddressesProvider", addressesProvider));
    const poolAddress = await addressesProviderInstance.getPool();
    const aTokenArtifact = await deploy(deploy_ids_1.ATOKEN_IMPL_ID, {
        contract: "AToken",
        from: deployer,
        args: [poolAddress],
        ...env_1.COMMON_DEPLOY_PARAMS,
    });
    const aToken = (await hre.ethers.getContractAt(aTokenArtifact.abi, aTokenArtifact.address));
    const aTokenInitArgs = [
        poolAddress,
        constants_1.ZERO_ADDRESS,
        constants_1.ZERO_ADDRESS,
        constants_1.ZERO_ADDRESS,
        0,
        "ATOKEN_IMPL",
        "ATOKEN_IMPL",
        "0x00",
    ];
    let aTokenNeedsInit = true;
    try {
        await aToken.callStatic.initialize(...aTokenInitArgs);
    }
    catch (e) {
        if (isAlreadyInitializedError(e)) {
            console.log("[Prydox] AToken implementation already initialized, skipping");
            aTokenNeedsInit = false;
        }
        else {
            throw e;
        }
    }
    if (aTokenNeedsInit) {
        await (0, helpers_1.waitForTx)(await aToken.initialize(...aTokenInitArgs));
    }
    const delegationAwareATokenArtifact = await deploy(deploy_ids_1.DELEGATION_AWARE_ATOKEN_IMPL_ID, {
        contract: "DelegationAwareAToken",
        from: deployer,
        args: [poolAddress],
        ...env_1.COMMON_DEPLOY_PARAMS,
    });
    const delegationAwareAToken = (await hre.ethers.getContractAt(delegationAwareATokenArtifact.abi, delegationAwareATokenArtifact.address));
    const delegationInitArgs = [
        poolAddress,
        constants_1.ZERO_ADDRESS,
        constants_1.ZERO_ADDRESS,
        constants_1.ZERO_ADDRESS,
        0,
        "DELEGATION_AWARE_ATOKEN_IMPL",
        "DELEGATION_AWARE_ATOKEN_IMPL",
        "0x00",
    ];
    let delegationNeedsInit = true;
    try {
        await delegationAwareAToken.callStatic.initialize(...delegationInitArgs);
    }
    catch (e) {
        if (isAlreadyInitializedError(e)) {
            console.log("[Prydox] DelegationAwareAToken implementation already initialized, skipping");
            delegationNeedsInit = false;
        }
        else {
            throw e;
        }
    }
    if (delegationNeedsInit) {
        await (0, helpers_1.waitForTx)(await delegationAwareAToken.initialize(...delegationInitArgs));
    }
    const stableDebtTokenArtifact = await deploy(deploy_ids_1.STABLE_DEBT_TOKEN_IMPL_ID, {
        contract: "StableDebtToken",
        from: deployer,
        args: [poolAddress],
        ...env_1.COMMON_DEPLOY_PARAMS,
    });
    const stableDebtToken = (await hre.ethers.getContractAt(stableDebtTokenArtifact.abi, stableDebtTokenArtifact.address));
    const stableInitArgs = [
        poolAddress,
        constants_1.ZERO_ADDRESS,
        constants_1.ZERO_ADDRESS,
        0,
        "STABLE_DEBT_TOKEN_IMPL",
        "STABLE_DEBT_TOKEN_IMPL",
        "0x00",
    ];
    let stableNeedsInit = true;
    try {
        await stableDebtToken.callStatic.initialize(...stableInitArgs);
    }
    catch (e) {
        if (isAlreadyInitializedError(e)) {
            console.log("[Prydox] StableDebtToken implementation already initialized, skipping");
            stableNeedsInit = false;
        }
        else {
            throw e;
        }
    }
    if (stableNeedsInit) {
        await (0, helpers_1.waitForTx)(await stableDebtToken.initialize(...stableInitArgs));
    }
    const variableDebtTokenArtifact = await deploy(deploy_ids_1.VARIABLE_DEBT_TOKEN_IMPL_ID, {
        contract: "VariableDebtToken",
        from: deployer,
        args: [poolAddress],
        ...env_1.COMMON_DEPLOY_PARAMS,
    });
    const variableDebtToken = (await hre.ethers.getContractAt(variableDebtTokenArtifact.abi, variableDebtTokenArtifact.address));
    const variableInitArgs = [
        poolAddress,
        constants_1.ZERO_ADDRESS,
        constants_1.ZERO_ADDRESS,
        0,
        "VARIABLE_DEBT_TOKEN_IMPL",
        "VARIABLE_DEBT_TOKEN_IMPL",
        "0x00",
    ];
    let variableNeedsInit = true;
    try {
        await variableDebtToken.callStatic.initialize(...variableInitArgs);
    }
    catch (e) {
        if (isAlreadyInitializedError(e)) {
            console.log("[Prydox] VariableDebtToken implementation already initialized, skipping");
            variableNeedsInit = false;
        }
        else {
            throw e;
        }
    }
    if (variableNeedsInit) {
        await (0, helpers_1.waitForTx)(await variableDebtToken.initialize(...variableInitArgs));
    }
    return true;
};
func.id = `TokenImplementations:${env_2.MARKET_NAME}:aave-v3-core@${constants_1.V3_CORE_VERSION}`;
func.tags = ["market", "tokens"];
exports.default = func;
