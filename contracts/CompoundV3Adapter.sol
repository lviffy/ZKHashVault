// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPoolAdapter.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IComet {
    function supply(address asset, uint256 amount) external;
    function supplyTo(address dst, address asset, uint256 amount) external;
    function withdraw(address asset, uint256 amount) external;
    function withdrawTo(address to, address asset, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title CompoundV3Adapter
 * @dev A real yield-generating adapter for Compound V3 (Comet). It exposes the same interface
 * as the IPoolAdapter so it drops perfectly into the `AdaptiveVault`.
 */
contract CompoundV3Adapter is IPoolAdapter {
    IERC20Like public immutable asset;
    IComet public immutable comet;
    address public vault;

    constructor(address _asset, address _comet) {
        asset = IERC20Like(_asset);
        comet = IComet(_comet);
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
        
        // 2. Approve the Compound V3 Comet Market to spend the asset
        asset.approve(address(comet), amount);
        
        // 3. Supply to Compound V3
        comet.supply(address(asset), amount);
    }

    function withdraw(uint256 amount) external onlyVault {
        require(amount > 0, "Zero amount");
        
        // Withdraw directly from Compound, sending the underlying asset back to the Vault
        // Note: For Comet, withdrawing to a different address implies withdrawing base token.
        comet.withdrawTo(msg.sender, address(asset), amount);
    }

    function getBalance(address user) external view returns (uint256) {
        // The cUSDCv3 (Comet) contract automatically rebases the user's base token 
        // balance natively via balanceOf(). Since this adapter is strictly dedicated 
        // to the connected Vault, we return this adapter's Compound balance.
        if (user != vault) return 0;
        return comet.balanceOf(address(this));
    }
}
