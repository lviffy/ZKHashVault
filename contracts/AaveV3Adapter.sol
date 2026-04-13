// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPoolAdapter.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/**
 * @title AaveV3Adapter
 * @dev A real yield-generating adapter for Aave V3. It exposes the same interface
 * as the IPoolAdapter so it drops perfectly into the `AdaptiveVault`.
 */
contract AaveV3Adapter is IPoolAdapter {
    IERC20Like public immutable asset;
    IERC20Like public immutable aToken;
    IPool public immutable aavePool;
    address public vault;

    // Use a setup pattern if vault is deployed after adapter, 
    // or set vault strictly in the constructor if deployed after the vault.
    constructor(address _asset, address _aToken, address _aavePool) {
        asset = IERC20Like(_asset);
        aToken = IERC20Like(_aToken);
        aavePool = IPool(_aavePool);
    }

    function setVault(address _vault) external {
        require(vault == address(0), "Vault already set");
        vault = _vault;
    }

    modifier onlyVault() {
        require(msg.sender == vault, "Unauthorized: Only Vault can call");
        _;
    }

    function deposit(uint256 amount) external onlyVault {
        require(amount > 0, "Zero amount");
        
        // 1. Pull underlying asset from the Vault into this adapter
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // 2. Approve the Aave Pool to spend the asset
        asset.approve(address(aavePool), amount);
        
        // 3. Supply to Aave V3 Pool, minting aTokens for THIS adapter
        aavePool.supply(address(asset), amount, address(this), 0);
    }

    function withdraw(uint256 amount) external onlyVault {
        require(amount > 0, "Zero amount");
        
        // Withdraw directly from Aave, sending the underlying asset back to the Vault
        aavePool.withdraw(address(asset), amount, msg.sender);
    }

    function getBalance(address user) external view returns (uint256) {
        // Since this adapter is strictly dedicated to the Vault, 
        // the total aToken balance strictly belongs to the connected Vault.
        // Aave's aTokens strictly rebase 1:1 to reflect earned interest.
        if (user != vault) return 0;
        return aToken.balanceOf(address(this));
    }
}
