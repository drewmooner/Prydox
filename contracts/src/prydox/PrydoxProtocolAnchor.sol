// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";

/**
 * @title PrydoxProtocolAnchor
 * @notice Anchors the Prydox build to Aave V3 core (`@aave/core-v3`). Deployment scripts
 *         will wire Pool, PoolAddressesProvider, and LitVM assets (USDC, LTC, zkLTC collateral).
 * @dev Keep this contract minimal; do not add mutable state here without review.
 */
contract PrydoxProtocolAnchor {
    /// @notice Compile-time link check: `IPool` from Aave core resolves via npm package path.
    function isPoolContract(IPool pool) external pure returns (bool) {
        return address(pool) != address(0);
    }
}
