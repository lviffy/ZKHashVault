// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IMockLendingPool.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MockLendingPool is IMockLendingPool {
    IERC20Like public immutable asset;
    mapping(address => uint256) public balances;

    constructor(address _asset) {
        asset = IERC20Like(_asset);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Zero amount");
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[msg.sender] += amount;
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Zero amount");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        require(asset.transfer(msg.sender, amount), "Transfer failed");
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    // Mock yield generation for tests
    function simulateYield(address user, uint256 amount, bool externalTransfer) external {
        balances[user] += amount;
        if (externalTransfer) {
            // Need the token transferred somehow? For this mock, the token must be sent directly 
            // to this contract first or sent from msg.sender.
            require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        }
    }
}
