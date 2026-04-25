// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Standalone testnet USDC: anyone can mint to themselves via `drip()` (cooldown).
 * @dev This is NOT automatically the Aave reserve USDC — add as reserve only if you deploy
 *      the market against this address. Default pool still uses env LITVM_TOKEN_USDC.
 */
contract PrydoxTestMintUSDC is ERC20 {
  uint8 private immutable _decimals;

  uint256 public immutable dripAmount;
  uint256 public immutable cooldown;

  mapping(address => uint256) public lastDrip;

  event Dripped(address indexed to, uint256 amount);

  constructor(
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    uint256 dripAmount_,
    uint256 cooldown_
  ) ERC20(name_, symbol_) {
    _decimals = decimals_;
    dripAmount = dripAmount_;
    cooldown = cooldown_;
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  /// @notice Mint `dripAmount` to caller once per `cooldown` (testnet only).
  function drip() external {
    require(block.timestamp >= lastDrip[msg.sender] + cooldown, "PrydoxTestMint: cooldown");
    lastDrip[msg.sender] = block.timestamp;
    _mint(msg.sender, dripAmount);
    emit Dripped(msg.sender, dripAmount);
  }
}
