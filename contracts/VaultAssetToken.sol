// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VaultAssetToken is ERC20, Ownable {
    error InvalidInput();

    constructor(address initialOwner) ERC20("ZK HashVault USD", "avUSD") Ownable(initialOwner == address(0) ? msg.sender : initialOwner) {}

    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0) || amount == 0) {
            revert InvalidInput();
        }

        _mint(to, amount);
    }
}