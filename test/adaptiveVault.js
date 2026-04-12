const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 1: AdaptiveVault", function () {
  async function latestBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }

  async function deployFixture() {
    const [owner, policyUpdater, user, outsider] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("VaultAssetToken");
    const token = await TokenFactory.deploy(owner.address);

    const VaultFactory = await ethers.getContractFactory("AdaptiveVault");
    const vault = await VaultFactory.deploy(await token.getAddress(), policyUpdater.address);

    await token.connect(owner).mint(user.address, ethers.parseEther("1000"));

    return { owner, policyUpdater, user, outsider, token, vault };
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
    const { policyUpdater, vault } = await deployFixture();
    const oracleTimestamp = await latestBlockTimestamp();

    await vault.setOracleBounds(1000, 3000);

    await expect(vault.connect(policyUpdater).rebalance(250, 2000, 25, ethers.parseUnits("1.3", 18), oracleTimestamp))
      .to.emit(vault, "Rebalanced")
      .withArgs(5000, 5000, 5250, 4750, 2000, 25, ethers.parseUnits("1.3", 18), oracleTimestamp);

    await expect(vault.connect(policyUpdater).rebalance(100, 999, 20, ethers.parseUnits("1.3", 18), oracleTimestamp))
      .to.be.revertedWithCustomError(vault, "OracleOutOfBounds")
      .withArgs(999);

    await expect(vault.connect(policyUpdater).rebalance(2200, 2000, 20, ethers.parseUnits("1.3", 18), oracleTimestamp))
      .to.be.revertedWithCustomError(vault, "RebalanceTooLarge")
      .withArgs(2200, 2000);

    await expect(vault.connect(policyUpdater).rebalance(100, 2000, 60, ethers.parseUnits("1.3", 18), oracleTimestamp))
      .to.be.revertedWithCustomError(vault, "SlippageTooHigh")
      .withArgs(60, 50);

    await expect(vault.connect(policyUpdater).rebalance(100, 2000, 30, ethers.parseUnits("1.1", 18), oracleTimestamp))
      .to.be.revertedWithCustomError(vault, "HealthFactorTooLow")
      .withArgs(ethers.parseUnits("1.1", 18), ethers.parseUnits("1.2", 18));

    await expect(vault.connect(policyUpdater).rebalance(100, 2000, 20, ethers.parseUnits("1.3", 18), 1))
      .to.be.revertedWithCustomError(vault, "OracleStale");
  });

  it("restricts policy updater role", async function () {
    const { outsider, vault } = await deployFixture();
    const oracleTimestamp = await latestBlockTimestamp();

    await expect(vault.connect(outsider).rebalance(100, 2000, 20, ethers.parseUnits("1.3", 18), oracleTimestamp)).to.be.revertedWithCustomError(vault, "Unauthorized");
  });
});
