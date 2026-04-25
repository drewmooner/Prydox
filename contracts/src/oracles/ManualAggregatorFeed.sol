// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice Chainlink AggregatorV3-compatible feed for LitVM: relayer writes answers (see
 *         `scripts/update-litvm-feeds-from-chainlink.js`), dApps read `latestRoundData` / `decimals`.
 * @dev Same pattern as Peer2Pepu/p2p-oracle: off-chain updater, on-chain Chainlink-shaped API.
 *      Price scale: 8 decimals (1 USD = 1e8), matching Prydox frontend + Aave oracle convention.
 */
contract ManualAggregatorFeed is Ownable {
  uint8 public constant DECIMALS = 8;

  int256 private _answer;
  uint256 private _roundId;
  uint256 private _updatedAt;

  event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);
  event NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt);

  constructor(int256 initialAnswer) {
    _answer = initialAnswer;
    _roundId = 1;
    _updatedAt = block.timestamp;
    emit AnswerUpdated(initialAnswer, _roundId, _updatedAt);
    emit NewRound(_roundId, msg.sender, block.timestamp);
  }

  function updateAnswer(int256 newAnswer) external onlyOwner {
    _roundId++;
    _answer = newAnswer;
    _updatedAt = block.timestamp;
    emit AnswerUpdated(newAnswer, _roundId, _updatedAt);
    emit NewRound(_roundId, msg.sender, block.timestamp);
  }

  function decimals() external pure returns (uint8) {
    return DECIMALS;
  }

  /// @notice Chainlink `AggregatorV3Interface.latestRoundData` — used by Prydox UI + tooling.
  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    uint80 r = uint80(_roundId);
    return (r, _answer, _updatedAt, _updatedAt, r);
  }

  function latestAnswer() external view returns (int256) {
    return _answer;
  }

  function latestTimestamp() external view returns (uint256) {
    return _updatedAt;
  }

  function latestRound() external view returns (uint256) {
    return _roundId;
  }

  function getAnswer(uint256 roundId) external view returns (int256) {
    return roundId == _roundId ? _answer : int256(0);
  }

  function getTimestamp(uint256 roundId) external view returns (uint256) {
    return roundId == _roundId ? _updatedAt : 0;
  }
}
