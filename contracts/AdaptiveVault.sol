// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IPositionSafetyGateway {
    function verifyPositionSafety(bytes32 signalHash, bytes calldata proof) external returns (bool);
}

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

interface IMockLendingPool {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getBalance(address user) external view returns (uint256);
}

contract AdaptiveVault {
    error Unauthorized();
    error InvalidInput();
    error InsufficientShares();
    error OracleOutOfBounds(uint64 oraclePrice);
    error OracleStale(uint64 oracleTimestamp, uint64 currentTimestamp);
    error RebalanceTooLarge(uint256 attemptedBps, uint256 maxBps);
    error SlippageTooHigh(uint256 attemptedBps, uint256 maxBps);
    error HealthFactorTooLow(uint256 observedHealthFactor, uint256 minHealthFactor);

    struct Allocation {
        uint16 poolABps;
        uint16 poolBBps;
        uint64 lastOraclePrice;
    }

    uint256 private constant BPS = 10_000;
    uint16 public constant MAX_ALLOCATION_DELTA_BPS = 2_000;
    uint16 public constant MAX_SLIPPAGE_BPS = 50;
    uint64 public constant MAX_ORACLE_STALENESS_SECONDS = 60;
    uint256 public constant MIN_HEALTH_FACTOR_WAD = 1.2e18;

    IERC20Like public immutable asset;
    address public immutable safetyGateway;
    AggregatorV3Interface public immutable priceFeed;
    IMockLendingPool public immutable poolA;
    IMockLendingPool public immutable poolB;
    address public owner;
    address public policyUpdater;

    uint256 public totalShares;
    mapping(address => uint256) public shareBalance;

    uint64 public oracleMinPrice;
    uint64 public oracleMaxPrice;
    Allocation public allocation;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PolicyUpdaterChanged(address indexed previousUpdater, address indexed newUpdater);
    event OracleBoundsUpdated(uint64 minPrice, uint64 maxPrice);
    event Deposited(address indexed user, uint256 assets, uint256 sharesMinted);
    event Withdrawn(address indexed user, uint256 sharesBurned, uint256 assetsReturned);
    event Rebalanced(
        uint16 previousPoolABps,
        uint16 previousPoolBBps,
        uint16 newPoolABps,
        uint16 newPoolBBps,
        uint64 oraclePrice,
        uint16 slippageBps,
        uint256 healthFactorWad,
        uint64 oracleTimestamp
    );

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        _;
    }

    modifier onlyPolicyUpdater() {
        if (msg.sender != policyUpdater) {
            revert Unauthorized();
        }
        _;
    }

    constructor(
        address assetAddress,
        address initialPolicyUpdater,
        address gatewayAddress,
        address priceFeedAddress,
        address poolAAddress,
        address poolBAddress
    ) {
        if (
            assetAddress == address(0) ||
            gatewayAddress == address(0) ||
            priceFeedAddress == address(0) ||
            poolAAddress == address(0) ||
            poolBAddress == address(0)
        ) {
            revert InvalidInput();
        }

        owner = msg.sender;
        policyUpdater = initialPolicyUpdater == address(0) ? msg.sender : initialPolicyUpdater;
        asset = IERC20Like(assetAddress);
        safetyGateway = gatewayAddress;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
        poolA = IMockLendingPool(poolAAddress);
        poolB = IMockLendingPool(poolBAddress);

        asset.approve(poolAAddress, type(uint256).max);
        asset.approve(poolBAddress, type(uint256).max);

        oracleMinPrice = 1;
        oracleMaxPrice = type(uint64).max;
        allocation = Allocation({poolABps: 5_000, poolBBps: 5_000, lastOraclePrice: 0});

        emit OwnershipTransferred(address(0), msg.sender);
        emit PolicyUpdaterChanged(address(0), policyUpdater);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert InvalidInput();
        }

        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setPolicyUpdater(address newPolicyUpdater) external onlyOwner {
        if (newPolicyUpdater == address(0)) {
            revert InvalidInput();
        }

        emit PolicyUpdaterChanged(policyUpdater, newPolicyUpdater);
        policyUpdater = newPolicyUpdater;
    }

    function setOracleBounds(uint64 minPrice, uint64 maxPrice) external onlyOwner {
        if (minPrice == 0 || minPrice > maxPrice) {
            revert InvalidInput();
        }

        oracleMinPrice = minPrice;
        oracleMaxPrice = maxPrice;
        emit OracleBoundsUpdated(minPrice, maxPrice);
    }

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this)) + poolA.getBalance(address(this)) + poolB.getBalance(address(this));
    }

    function deposit(uint256 assets) external returns (uint256 sharesMinted) {
        if (assets == 0) {
            revert InvalidInput();
        }

        uint256 totalAssetsBefore = totalAssets();
        if (totalShares == 0 || totalAssetsBefore == 0) {
            sharesMinted = assets;
        } else {
            sharesMinted = (assets * totalShares) / totalAssetsBefore;
        }

        if (sharesMinted == 0) {
            revert InvalidInput();
        }

        bool transferred = asset.transferFrom(msg.sender, address(this), assets);
        if (!transferred) {
            revert InvalidInput();
        }

        uint256 amountA = (assets * allocation.poolABps) / BPS;
        uint256 amountB = assets - amountA;
        
        if (amountA > 0) poolA.deposit(amountA);
        if (amountB > 0) poolB.deposit(amountB);

        totalShares += sharesMinted;
        shareBalance[msg.sender] += sharesMinted;

        emit Deposited(msg.sender, assets, sharesMinted);
    }

    function withdraw(uint256 sharesBurned) external returns (uint256 assetsReturned) {
        if (sharesBurned == 0) {
            revert InvalidInput();
        }

        uint256 userShares = shareBalance[msg.sender];
        if (sharesBurned > userShares) {
            revert InsufficientShares();
        }

        assetsReturned = (sharesBurned * totalAssets()) / totalShares;
        if (assetsReturned == 0) {
            revert InvalidInput();
        }

        shareBalance[msg.sender] = userShares - sharesBurned;
        totalShares -= sharesBurned;

        uint256 amountToWithdrawA = (assetsReturned * allocation.poolABps) / BPS;
        uint256 amountToWithdrawB = assetsReturned - amountToWithdrawA;

        if (amountToWithdrawA > 0) poolA.withdraw(amountToWithdrawA);
        if (amountToWithdrawB > 0) poolB.withdraw(amountToWithdrawB);

        bool transferred = asset.transfer(msg.sender, assetsReturned);
        if (!transferred) {
            revert InvalidInput();
        }

        emit Withdrawn(msg.sender, sharesBurned, assetsReturned);
    }

    function rebalance(
        int256 deltaPoolABps,
        uint16 slippageBps,
        uint256 healthFactorWad,
        bytes32 signalHash,
        bytes calldata proof
    ) external onlyPolicyUpdater {
        IPositionSafetyGateway(safetyGateway).verifyPositionSafety(signalHash, proof);

        (, int256 answer, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        if (answer <= 0) revert InvalidInput();

        uint64 oraclePrice = uint64(uint256(answer));
        uint64 oracleTimestamp = uint64(updatedAt);
        if (oraclePrice < oracleMinPrice || oraclePrice > oracleMaxPrice) {
            revert OracleOutOfBounds(oraclePrice);
        }

        if (oracleTimestamp > uint64(block.timestamp) || uint64(block.timestamp) - oracleTimestamp > MAX_ORACLE_STALENESS_SECONDS) {
            revert OracleStale(oracleTimestamp, uint64(block.timestamp));
        }

        if (slippageBps > MAX_SLIPPAGE_BPS) {
            revert SlippageTooHigh(slippageBps, MAX_SLIPPAGE_BPS);
        }

        if (healthFactorWad < MIN_HEALTH_FACTOR_WAD) {
            revert HealthFactorTooLow(healthFactorWad, MIN_HEALTH_FACTOR_WAD);
        }

        uint256 absDelta = deltaPoolABps >= 0 ? uint256(deltaPoolABps) : uint256(-deltaPoolABps);
        if (absDelta > MAX_ALLOCATION_DELTA_BPS) {
            revert RebalanceTooLarge(absDelta, MAX_ALLOCATION_DELTA_BPS);
        }

        int256 newPoolA = int256(uint256(allocation.poolABps)) + deltaPoolABps;
        if (newPoolA < 0 || newPoolA > int256(BPS)) {
            revert InvalidInput();
        }

        uint16 previousPoolA = allocation.poolABps;
        uint16 previousPoolB = allocation.poolBBps;
        uint16 updatedPoolA = uint16(uint256(newPoolA));
        uint16 updatedPoolB = uint16(BPS - updatedPoolA);

        allocation = Allocation({poolABps: updatedPoolA, poolBBps: updatedPoolB, lastOraclePrice: oraclePrice});

        uint256 currentA = poolA.getBalance(address(this));
        uint256 currentB = poolB.getBalance(address(this));
        uint256 currentTotal = currentA + currentB + asset.balanceOf(address(this));

        uint256 targetA = (currentTotal * updatedPoolA) / BPS;
        uint256 targetB = currentTotal - targetA;

        if (currentA > targetA) {
            poolA.withdraw(currentA - targetA);
        } else if (currentA < targetA) {
            poolA.deposit(targetA - currentA);
        }

        if (currentB > targetB) {
            poolB.withdraw(currentB - targetB);
        } else if (currentB < targetB) {
            poolB.deposit(targetB - currentB);
        }

        emit Rebalanced(previousPoolA, previousPoolB, updatedPoolA, updatedPoolB, oraclePrice, slippageBps, healthFactorWad, oracleTimestamp);
    }
}
