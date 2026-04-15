import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { runStrategyTick } from "../services/strategy/src/index";
import { StrategySnapshotCache } from "../services/strategy/src/snapshotCache";

describe("Phase 2 Integration: Strategy Engine -> Vault Execution", function () {
  async function deployFixture() {
    const [owner, policyUpdater, user, proofSigner] = await ethers.getSigners();
    
    const TokenFactory = await ethers.getContractFactory("VaultAssetToken");
    const token = await TokenFactory.deploy(owner.address);

    const VerifierFactory = await ethers.getContractFactory("SafetyProofVerifier");
    const verifier = await VerifierFactory.deploy(proofSigner.address, owner.address);

    const GatewayFactory = await ethers.getContractFactory("PositionSafetyGateway");
    const gateway = await GatewayFactory.deploy(await verifier.getAddress());

    const AggregatorFactory = await ethers.getContractFactory("HashKeyPriceOracle");
    // Give it a price of 2000
    const aggregator = await AggregatorFactory.deploy(2000);

    const ProtocolFactory = await ethers.getContractFactory("HashKeyLendingProtocol");
    const protocolA = await ProtocolFactory.deploy(await token.getAddress());
    const protocolB = await ProtocolFactory.deploy(await token.getAddress());

    const AdapterFactory = await ethers.getContractFactory("HashKeyLendingAdapter");
    const poolA = await AdapterFactory.deploy(await token.getAddress(), await protocolA.getAddress());
    const poolB = await AdapterFactory.deploy(await token.getAddress(), await protocolB.getAddress());

    const VaultFactory = await ethers.getContractFactory("ZKHashVault");
    const vault = await VaultFactory.deploy(
      await token.getAddress(),
      policyUpdater.address,
      await gateway.getAddress(),
      await aggregator.getAddress(),
      await poolA.getAddress(),
      await poolB.getAddress()
    );

    await poolA.setVault(await vault.getAddress());
    await poolB.setVault(await vault.getAddress());

    // Provide the vault with initial funds so rebalance has math to work with
    await token.connect(owner).mint(user.address, ethers.parseEther("1000"));
    await token.connect(user).approve(await vault.getAddress(), ethers.parseEther("1000"));
    await vault.connect(user).deposit(ethers.parseEther("1000"));

    return { owner, policyUpdater, user, proofSigner, vault, gateway, aggregator, token };
  }

  it("should generate a valid rebalance instruction that succeeds on-chain", async function () {
    const { policyUpdater, proofSigner, vault, aggregator } = await deployFixture();
    
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

    // 3. Submit instruction to the ZKHashVault smart contract via the Policy Updater
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
        await aggregator.lastUpdate()
     );
     
    // 4. Verify on-chain state matches strategy target
    const updatedAllocation = await vault.allocation();
    expect(updatedAllocation.poolABps).to.equal(5000 + instruction.deltaPoolABps);
  });

  it("should fail when instruction slippage is too high", async function() {
    const { policyUpdater, proofSigner, vault } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("integration-test-signal"));
    const proof = await proofSigner.signMessage(ethers.getBytes(signalHash));
    
    // Simulate engine outputting too high slippage
    await expect(
      vault.connect(policyUpdater).rebalance(
        1000,
        100, // 1% slippage, greater than 0.5% MAX
        ethers.parseEther("1.5"),
        signalHash,
        proof
      )
    ).to.be.revertedWithCustomError(vault, "SlippageTooHigh");
  });

  it("should fail when target delta is too large", async function() {
    const { policyUpdater, proofSigner, vault } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("integration-test-signal"));
    const proof = await proofSigner.signMessage(ethers.getBytes(signalHash));
    
    // Attempt delta of 25%, MAX is 20%
    await expect(
      vault.connect(policyUpdater).rebalance(
        2500,
        30,
        ethers.parseEther("1.5"),
        signalHash,
        proof
      )
    ).to.be.revertedWithCustomError(vault, "RebalanceTooLarge");
  });

  it("should fail when health factor is too low", async function() {
    const { policyUpdater, proofSigner, vault } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("integration-test-signal"));
    const proof = await proofSigner.signMessage(ethers.getBytes(signalHash));
    
    // Health factor 1.1x, MIN is 1.2x
    await expect(
      vault.connect(policyUpdater).rebalance(
        1000,
        30,
        ethers.parseEther("1.1"),
        signalHash,
        proof
      )
    ).to.be.revertedWithCustomError(vault, "HealthFactorTooLow");
  });

  it("should fail when oracle is stale", async function() {
    const { policyUpdater, proofSigner, vault } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("integration-test-signal"));
    const proof = await proofSigner.signMessage(ethers.getBytes(signalHash));
    
    // Advance time by 61 seconds (MAX staleness is 60 sec)
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      vault.connect(policyUpdater).rebalance(
        1000,
        30,
        ethers.parseEther("1.5"),
        signalHash,
        proof
      )
    ).to.be.revertedWithCustomError(vault, "OracleStale");
  });
});