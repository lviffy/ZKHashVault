import { expect } from "chai";
import { ethers } from "hardhat";
import { runStrategyTick } from "../services/strategy/src/index.ts";
import { StrategySnapshotCache } from "../services/strategy/src/snapshotCache.ts";

describe("Phase 2 Integration: Strategy Engine -> Vault Execution", function () {
  async function deployFixture() {
    const [owner, policyUpdater, user, proofSigner] = await ethers.getSigners();
    
    const TokenFactory = await ethers.getContractFactory("VaultAssetToken");
    const token = await TokenFactory.deploy(owner.address);

    const VerifierFactory = await ethers.getContractFactory("SafetyProofVerifier");
    const verifier = await VerifierFactory.deploy(proofSigner.address, owner.address);

    const GatewayFactory = await ethers.getContractFactory("PositionSafetyGateway");
    const gateway = await GatewayFactory.deploy(await verifier.getAddress());

    const AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
    // Give it a price of 2000
    const aggregator = await AggregatorFactory.deploy(8, 2000);

    const MockPoolFactory = await ethers.getContractFactory("MockLendingPool");
    const poolA = await MockPoolFactory.deploy(await token.getAddress());
    const poolB = await MockPoolFactory.deploy(await token.getAddress());

    const VaultFactory = await ethers.getContractFactory("AdaptiveVault");
    const vault = await VaultFactory.deploy(
      await token.getAddress(),
      policyUpdater.address,
      await gateway.getAddress(),
      await aggregator.getAddress(),
      await poolA.getAddress(),
      await poolB.getAddress()
    );

    // Provide the vault with initial funds so rebalance has math to work with
    await token.connect(owner).mint(user.address, ethers.parseEther("1000"));
    await token.connect(user).approve(await vault.getAddress(), ethers.parseEther("1000"));
    await vault.connect(user).deposit(ethers.parseEther("1000"));

    return { owner, policyUpdater, user, proofSigner, vault, gateway, aggregator, token };
  }

  it("should generate a valid rebalance instruction that succeeds on-chain", async function () {
    const { policyUpdater, proofSigner, vault } = await deployFixture();
    
    // Get the current on-chain oracle timestamp and price
    const latestBlock = await ethers.provider.getBlock("latest");
    const nowTimestamp = latestBlock.timestamp;
    const cache = new StrategySnapshotCache();

    // 1. Run the Strategy Engine
    const strategyResult = await runStrategyTick({
      snapshot: {
        timestamp: nowTimestamp,
        poolAApyBps: 1100,
        poolBApyBps: 900,
        volatilityBps: 5000,
        utilizationBps: 8000,
        estimatedSlippageBps: 30, // 0.3%
        positionHealthFactorBps: 15000, // 1.5x
        oraclePrice: 2000,
      },
      currentPoolABps: 5000,
      config: {
        cadenceSeconds: 600,
        maxRebalanceDeltaBps: 2000,
        maxSlippageBps: 50,
        minHealthFactorBps: 12000,
        maxOracleAgeSeconds: 60,
        nowTimestamp: nowTimestamp,
        minOraclePrice: 1000,
        maxOraclePrice: 3000,
      },
      cache
    });

    expect(strategyResult.ok).to.be.true;
    const instruction = strategyResult.instruction;
    
    // 2. Create the cryptographic proof payload to satisfy the Gateway
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("integration-test-signal"));
    const proof = await proofSigner.signMessage(ethers.getBytes(signalHash));

    // 3. Submit instruction to the AdaptiveVault smart contract via the Policy Updater
    // function rebalance(int256 deltaPoolABps, uint16 slippageBps, uint256 healthFactorWad, bytes32 signalHash, bytes calldata proof)
    await expect(
      vault.connect(policyUpdater).rebalance(
        instruction.deltaPoolABps,
        instruction.slippageBps,
        instruction.healthFactorWad,
        signalHash,
        proof
      )
    ).to.emit(vault, "Rebalanced")
     .withArgs(
        5000, // previous pool A
        5000, // previous pool B
        5000 + instruction.deltaPoolABps, // new pool A
        5000 - instruction.deltaPoolABps, // new pool B
        instruction.oraclePrice,
        instruction.slippageBps,
        instruction.healthFactorWad,
        instruction.oracleTimestamp
     );
     
    // 4. Verify on-chain state matches strategy target
    const updatedAllocation = await vault.allocation();
    expect(updatedAllocation.poolABps).to.equal(5000 + instruction.deltaPoolABps);
  });
});