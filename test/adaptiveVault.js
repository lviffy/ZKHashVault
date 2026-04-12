const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 1: AdaptiveVault", function () {
  async function latestBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }

  async function deployFixture() {
    const [owner, policyUpdater, user, outsider, proofSigner] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("VaultAssetToken");
    const token = await TokenFactory.deploy(owner.address);

    const VerifierFactory = await ethers.getContractFactory("SafetyProofVerifier");
    const verifier = await VerifierFactory.deploy(proofSigner.address, owner.address);

    const GatewayFactory = await ethers.getContractFactory("PositionSafetyGateway");
    const gateway = await GatewayFactory.deploy(await verifier.getAddress());

    const AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
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

    await token.connect(owner).mint(user.address, ethers.parseEther("1000"));

    return { owner, policyUpdater, user, outsider, proofSigner, token, vault, gateway, aggregator, poolA, poolB };
  }

  it("handles deposit and withdraw flow", async function () {
    const { user, token, vault } = await deployFixture();

    const depositAmount = ethers.parseEther("100");

    await token.connect(user).approve(await vault.getAddress(), depositAmount);

    await expect(vault.connect(user).deposit(depositAmount))
      .to.emit(vault, "Deposited")
      .withArgs(user.address, depositAmount, depositAmount);

    expect(await vault.totalAssets()).to.equal(depositAmount);
    expect(await vault.totalShares()).to.equal(depositAmount);

    const withdrawShares = ethers.parseEther("40");

    await expect(vault.connect(user).withdraw(withdrawShares))
      .to.emit(vault, "Withdrawn")
      .withArgs(user.address, withdrawShares, withdrawShares);

    expect(await vault.totalAssets()).to.equal(ethers.parseEther("60"));
    expect(await vault.totalShares()).to.equal(ethers.parseEther("60"));
  });

  it("enforces rebalance guardrails and oracle checks", async function () {
    const { policyUpdater, vault, proofSigner, gateway, aggregator } = await deployFixture();
    const oracleTimestamp = await latestBlockTimestamp();

    await vault.setOracleBounds(1000, 3000);

    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("dummy-signal"));
    const proof = await proofSigner.signMessage(ethers.getBytes(signalHash));

    await expect(vault.connect(policyUpdater).rebalance(250, 25, ethers.parseUnits("1.3", 18), signalHash, proof))
      .to.emit(vault, "Rebalanced");

    await aggregator.updateAnswer(999);
    await expect(vault.connect(policyUpdater).rebalance(100, 20, ethers.parseUnits("1.3", 18), signalHash, proof))
      .to.be.revertedWithCustomError(vault, "OracleOutOfBounds")
      .withArgs(999);
    await aggregator.updateAnswer(2000);

    await expect(vault.connect(policyUpdater).rebalance(2200, 20, ethers.parseUnits("1.3", 18), signalHash, proof))
      .to.be.revertedWithCustomError(vault, "RebalanceTooLarge")
      .withArgs(2200, 2000);

    await expect(vault.connect(policyUpdater).rebalance(100, 60, ethers.parseUnits("1.3", 18), signalHash, proof))
      .to.be.revertedWithCustomError(vault, "SlippageTooHigh")
      .withArgs(60, 50);

    await expect(vault.connect(policyUpdater).rebalance(100, 30, ethers.parseUnits("1.1", 18), signalHash, proof))
      .to.be.revertedWithCustomError(vault, "HealthFactorTooLow")
      .withArgs(ethers.parseUnits("1.1", 18), ethers.parseUnits("1.2", 18));

    // Fast forward time to make the oracle stale...
    await ethers.provider.send("evm_increaseTime", [120]);
    await expect(vault.connect(policyUpdater).rebalance(100, 20, ethers.parseUnits("1.3", 18), signalHash, proof))
      .to.be.revertedWithCustomError(vault, "OracleStale");

    const badProof = await proofSigner.signMessage(ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes("wrong"))));
    await expect(vault.connect(policyUpdater).rebalance(250, 25, ethers.parseUnits("1.3", 18), signalHash, badProof))
      .to.be.revertedWithCustomError(gateway, "ProofRejected");
  });

  it("restricts policy updater role", async function () {
    const { outsider, vault, proofSigner } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("dummy-signal"));
    const proof = await proofSigner.signMessage(ethers.getBytes(signalHash));

    await expect(vault.connect(outsider).rebalance(100, 20, ethers.parseUnits("1.3", 18), signalHash, proof)).to.be.revertedWithCustomError(vault, "Unauthorized");
  });
});
