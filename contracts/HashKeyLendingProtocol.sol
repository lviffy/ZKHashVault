// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMintableERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function mint(address to, uint256 amount) external;
}

contract HashKeyLendingProtocol {
    IMintableERC20 public asset;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lastUpdate;
    uint256 public constant APY_BPS = 500; // 5% APY
    uint256 public constant SECONDS_PER_YEAR = 31536000;

    constructor(address _asset) {
        asset = IMintableERC20(_asset);
    }

    function _accrueInterest(address user) internal {
        if (balances[user] > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdate[user];
            uint256 interest = (balances[user] * APY_BPS * timeElapsed) / (10000 * SECONDS_PER_YEAR);
            balances[user] += interest;
        }
        lastUpdate[user] = block.timestamp;
    }

    // Aave V3 interface match
    function supply(address _asset, uint256 amount, address onBehalfOf, uint16) external {
        require(_asset == address(asset), "Wrong asset");
        _accrueInterest(onBehalfOf);
        asset.transferFrom(msg.sender, address(this), amount);
        balances[onBehalfOf] += amount;
    }

    function withdraw(address _asset, uint256 amount, address to) external returns (uint256) {
        require(_asset == address(asset), "Wrong asset");
        _accrueInterest(msg.sender);
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;

        // Since this is a testnet protocol with real yielding mechanisms, 
        // we simulate real interest payout by minting the missing delta if needed
        uint256 contractBalance = asset.balanceOf(address(this));
        if (contractBalance < amount) {
            asset.mint(address(this), amount - contractBalance); // Faucet the interest out of thin air for the testnet
        }
        
        asset.transfer(to, amount);
        return amount;
    }

    // Custom method to check rebasing balance
    function balanceOf(address user) external view returns (uint256) {
        if (balances[user] == 0) return 0;
        uint256 timeElapsed = block.timestamp - lastUpdate[user];
        uint256 interest = (balances[user] * APY_BPS * timeElapsed) / (10000 * SECONDS_PER_YEAR);
        return balances[user] + interest;
    }
}
