// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Testnet faucet: holds USDC + native zkLTC; users call `drip()` once per cooldown.
 * @dev Fund by sending zkLTC to this contract and transferring USDC in (owner or any funder).
 *      This does not mint — use when reserve tokens are not TestnetERC20-owned-by-faucet.
 */
contract PrydoxFaucet is Ownable {
  IERC20 public immutable usdc;
  uint256 public immutable dripUsdc;
  uint256 public immutable dripNative;
  uint256 public immutable cooldown;

  mapping(address => uint256) public lastDrip;

  event Dripped(address indexed to, uint256 usdcAmt, uint256 nativeAmt);
  event Funded(address indexed from, uint256 usdcAmt, uint256 nativeAmt);

  constructor(
    address usdc_,
    uint256 dripUsdc_,
    uint256 dripNative_,
    uint256 cooldown_,
    address owner_
  ) {
    require(usdc_ != address(0) && owner_ != address(0), "Faucet: zero");
    usdc = IERC20(usdc_);
    dripUsdc = dripUsdc_;
    dripNative = dripNative_;
    cooldown = cooldown_;
    _transferOwnership(owner_);
  }

  function drip() external {
    address to = msg.sender;
    require(block.timestamp >= lastDrip[to] + cooldown, "Faucet: cooldown");
    lastDrip[to] = block.timestamp;

    require(address(this).balance >= dripNative, "Faucet: no zkLTC");
    require(usdc.balanceOf(address(this)) >= dripUsdc, "Faucet: no USDC");

    require(usdc.transfer(to, dripUsdc), "Faucet: USDC transfer");

    (bool ok, ) = to.call{value: dripNative}("");
    require(ok, "Faucet: native send");

    emit Dripped(to, dripUsdc, dripNative);
  }

  receive() external payable {
    emit Funded(msg.sender, 0, msg.value);
  }

  /// @notice Pull USDC from caller into the faucet pool.
  function fundUsdc(uint256 amount) external {
    require(usdc.transferFrom(msg.sender, address(this), amount), "Faucet: USDC fund");
    emit Funded(msg.sender, amount, 0);
  }

  function withdrawUsdc(uint256 amount, address to) external onlyOwner {
    require(usdc.transfer(to, amount), "Faucet: withdraw USDC");
  }

  function withdrawNative(uint256 amount, address payable to) external onlyOwner {
    (bool ok, ) = to.call{value: amount}("");
    require(ok, "Faucet: withdraw native");
  }
}
