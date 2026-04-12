const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 1: AdaptiveVault", function () {
  async function deployFixture() {
    const [owner, policyUpdater, user, outsider] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("MockERC20");
    const token = await TokenFactory.deploy("Mock USD", "mUSD");

    const VaultFactory = await ethers.getContractFactory("AdaptiveVault");
    const vault = await VaultFactory.deploy(await token.getAddress(), policyUpdater.address);

    await token.mint(user.address, ethers.parseEther("1000"));

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

    await vault.setOracleBounds(1000, 3000);
    await vault.setMaxRebalanceBps(500);

    await expect(vault.connect(policyUpdater).rebalance(250, 2000))
      .to.emit(vault, "Rebalanced")
      .withArgs(5000, 5000, 5250, 4750, 2000);

    await expect(vault.connect(policyUpdater).rebalance(100, 999))
      .to.be.revertedWithCustomError(vault, "OracleOutOfBounds")
      .withArgs(999);

    await expect(vault.connect(policyUpdater).rebalance(700, 2000))
      .to.be.revertedWithCustomError(vault, "RebalanceTooLarge")
      .withArgs(700, 500);
  });

  it("restricts policy updater role", async function () {
    const { outsider, vault } = await deployFixture();

    await expect(vault.connect(outsider).rebalance(100, 2000)).to.be.revertedWithCustomError(vault, "Unauthorized");
  });
});
