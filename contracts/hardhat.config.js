require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-dependency-compiler");

const { DEFAULT_NAMED_ACCOUNTS } = require("@aave/deploy-v3/dist/helpers/constants");
const { loadTasks } = require("@aave/deploy-v3/dist/helpers/hardhat-config-helpers");

// Aave deploy hook scripts call these tasks (e.g. disable-faucet-native-testnets, print-deployments).
loadTasks(["misc", "market-registry"]);

// Deploy sanity check: confirm reserve/feed env used by market config.
console.log("USDC token:", process.env.LITVM_TOKEN_USDC);
console.log("USDC feed:", process.env.LITVM_FEED_USDC);
console.log("Production mode:", process.env.PRYDOX_LITVM_PRODUCTION);

/** LitVM LiteForge testnet — official params from https://docs.litvm.com/get-started-on-testnet/add-to-wallet */
const LITVM_LITE_FORGE_CHAIN_ID = 4441;
const LITVM_LITE_FORGE_RPC_DEFAULT = "https://liteforge.rpc.caldera.xyz/http";

function litvmDeployerAccounts() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk || !pk.trim()) return [];
  const trimmed = pk.trim();
  return [trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`];
}

/**
 * Prydox Hardhat stack:
 * - Your contracts live in `./src` (e.g. PrydoxProtocolAnchor).
 * - Aave V3 core + periphery are compiled via `hardhat-dependency-compiler` (same paths as @aave/deploy-v3).
 * - Aave’s deployment scripts are wired through `hardhat-deploy` `external.contracts` (see @aave/deploy-v3 README).
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: { enabled: true, runs: 100000 },
          evmVersion: "berlin",
        },
      },
    ],
  },
  paths: {
    sources: "./src",
    cache: "./cache_hardhat",
    artifacts: "./artifacts_hardhat",
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      hardfork: "berlin",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    /** Prydox on LitVM: same bytecode as local; RPC + chainId target the real testnet. */
    litvmLiteforge: {
      url: process.env.LITVM_RPC_URL || LITVM_LITE_FORGE_RPC_DEFAULT,
      chainId: LITVM_LITE_FORGE_CHAIN_ID,
      accounts: litvmDeployerAccounts(),
      live: true,
      timeout: 600000,
    },
  },
  namedAccounts: DEFAULT_NAMED_ACCOUNTS,
  external: {
    contracts: [
      {
        artifacts: "node_modules/@aave/deploy-v3/artifacts",
        deploy: "node_modules/@aave/deploy-v3/dist/deploy",
      },
    ],
  },
  dependencyCompiler: {
    paths: [
      "@aave/core-v3/contracts/protocol/configuration/PoolAddressesProviderRegistry.sol",
      "@aave/core-v3/contracts/protocol/configuration/PoolAddressesProvider.sol",
      "@aave/core-v3/contracts/misc/AaveOracle.sol",
      "@aave/core-v3/contracts/protocol/tokenization/AToken.sol",
      "@aave/core-v3/contracts/protocol/tokenization/DelegationAwareAToken.sol",
      "@aave/core-v3/contracts/protocol/tokenization/StableDebtToken.sol",
      "@aave/core-v3/contracts/protocol/tokenization/VariableDebtToken.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/GenericLogic.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/ValidationLogic.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/ReserveLogic.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/SupplyLogic.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/EModeLogic.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/BorrowLogic.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/BridgeLogic.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/FlashLoanLogic.sol",
      "@aave/core-v3/contracts/protocol/libraries/logic/CalldataLogic.sol",
      "@aave/core-v3/contracts/protocol/pool/Pool.sol",
      "@aave/core-v3/contracts/protocol/pool/L2Pool.sol",
      "@aave/core-v3/contracts/protocol/pool/PoolConfigurator.sol",
      "@aave/core-v3/contracts/protocol/pool/DefaultReserveInterestRateStrategy.sol",
      "@aave/core-v3/contracts/protocol/libraries/aave-upgradeability/InitializableImmutableAdminUpgradeabilityProxy.sol",
      "@aave/core-v3/contracts/dependencies/openzeppelin/upgradeability/InitializableAdminUpgradeabilityProxy.sol",
      "@aave/core-v3/contracts/deployments/ReservesSetupHelper.sol",
      "@aave/core-v3/contracts/misc/AaveProtocolDataProvider.sol",
      "@aave/core-v3/contracts/misc/L2Encoder.sol",
      "@aave/core-v3/contracts/protocol/configuration/ACLManager.sol",
      "@aave/core-v3/contracts/dependencies/weth/WETH9.sol",
      "@aave/core-v3/contracts/mocks/helpers/MockIncentivesController.sol",
      "@aave/core-v3/contracts/mocks/helpers/MockReserveConfiguration.sol",
      "@aave/core-v3/contracts/mocks/oracle/CLAggregators/MockAggregator.sol",
      "@aave/core-v3/contracts/mocks/tokens/MintableERC20.sol",
      "@aave/core-v3/contracts/mocks/flashloan/MockFlashLoanReceiver.sol",
      "@aave/core-v3/contracts/mocks/tokens/WETH9Mocked.sol",
      "@aave/core-v3/contracts/mocks/upgradeability/MockVariableDebtToken.sol",
      "@aave/core-v3/contracts/mocks/upgradeability/MockAToken.sol",
      "@aave/core-v3/contracts/mocks/upgradeability/MockStableDebtToken.sol",
      "@aave/core-v3/contracts/mocks/upgradeability/MockInitializableImplementation.sol",
      "@aave/core-v3/contracts/mocks/helpers/MockPool.sol",
      "@aave/core-v3/contracts/mocks/helpers/MockL2Pool.sol",
      "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol",
      "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol",
      "@aave/core-v3/contracts/mocks/oracle/PriceOracle.sol",
      "@aave/core-v3/contracts/mocks/tokens/MintableDelegationERC20.sol",
      "@aave/periphery-v3/contracts/misc/UiPoolDataProviderV3.sol",
      "@aave/periphery-v3/contracts/misc/WalletBalanceProvider.sol",
      "@aave/periphery-v3/contracts/misc/WrappedTokenGatewayV3.sol",
      "@aave/periphery-v3/contracts/misc/interfaces/IWETH.sol",
      "@aave/periphery-v3/contracts/misc/UiIncentiveDataProviderV3.sol",
      "@aave/periphery-v3/contracts/rewards/RewardsController.sol",
      "@aave/periphery-v3/contracts/rewards/transfer-strategies/StakedTokenTransferStrategy.sol",
      "@aave/periphery-v3/contracts/rewards/transfer-strategies/PullRewardsTransferStrategy.sol",
      "@aave/periphery-v3/contracts/rewards/EmissionManager.sol",
      "@aave/periphery-v3/contracts/mocks/WETH9Mock.sol",
      "@aave/periphery-v3/contracts/mocks/testnet-helpers/Faucet.sol",
      "@aave/periphery-v3/contracts/mocks/testnet-helpers/TestnetERC20.sol",
      "@aave/periphery-v3/contracts/treasury/Collector.sol",
      "@aave/periphery-v3/contracts/treasury/CollectorController.sol",
      "@aave/periphery-v3/contracts/treasury/AaveEcosystemReserveV2.sol",
      "@aave/periphery-v3/contracts/treasury/AaveEcosystemReserveController.sol",
      // Paraswap adapters omitted: extra deps; prebuilt artifacts still available via @aave/deploy-v3.
      // Safety module omitted: requires @aave/aave-token; not needed for core pool + Test market.
    ],
  },
};
