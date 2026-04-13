// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

contract HashKeyPriceOracle is AggregatorV3Interface {
    address public updater;
    int256 public currentAnswer;
    uint256 public lastUpdate;

    constructor(int256 initialPrice) {
        updater = msg.sender;
        currentAnswer = initialPrice;
        lastUpdate = block.timestamp;
    }

    function updateAnswer(int256 newAnswer) external {
        require(msg.sender == updater, "Unauthorized");
        currentAnswer = newAnswer;
        lastUpdate = block.timestamp;
    }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (1, currentAnswer, lastUpdate, lastUpdate, 1);
    }
}
