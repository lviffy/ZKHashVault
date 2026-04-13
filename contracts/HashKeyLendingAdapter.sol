// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPoolAdapter.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IHashKeyProtocol {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function balances(address user) external view returns (uint256);
    function balanceOf(address user) external view returns (uint256);
}

contract HashKeyLendingAdapter is IPoolAdapter {
    IERC20Like public immutable asset;
    IHashKeyProtocol public immutable protocol;
    address public vault;

    constructor(address _asset, address _protocol) {
        asset = IERC20Like(_asset);
        protocol = IHashKeyProtocol(_protocol);
    }

    function setVault(address _vault) external {
        require(vault == address(0), "Vault already set");
        vault = _vault;
    }

    modifier onlyVault() {
        require(msg.sender == vault, "Unauthorized");
        _;
    }

    function deposit(uint256 amount) external onlyVault {
        require(amount > 0, "Zero amount");
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        asset.approve(address(protocol), amount);
        protocol.supply(address(asset), amount, address(this), 0);
    }

    function withdraw(uint256 amount) external onlyVault {
        require(amount > 0, "Zero amount");
        // In the native hashkey protocol it returns the underlying asset directly
        protocol.withdraw(address(asset), amount, msg.sender);
    }

    function getBalance(address user) external view returns (uint256) {
        if (user != vault) return 0;
        return protocol.balanceOf(address(this));
    }
}
