// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPoolAdapter {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getBalance(address user) external view returns (uint256);
}
