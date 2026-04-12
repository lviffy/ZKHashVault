const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 3: PositionSafetyGateway", function () {
  async function deployFixture() {
    const [owner, proofSigner, user, outsider] = await ethers.getSigners();

    const VerifierFactory = await ethers.getContractFactory("SafetyProofVerifier");
    const verifier = await VerifierFactory.deploy(proofSigner.address, owner.address);

    const GatewayFactory = await ethers.getContractFactory("PositionSafetyGateway");
    const gateway = await GatewayFactory.deploy(await verifier.getAddress());

    return { owner, proofSigner, user, outsider, verifier, gateway };
  }

  it("accepts a valid proof and emits event", async function () {
    const { user, proofSigner, gateway } = await deployFixture();

    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("health:ok"));
    const proof = await proofSigner.signMessage(ethers.getBytes(signalHash));

    await expect(gateway.connect(user).verifyPositionSafety(signalHash, proof))
      .to.emit(gateway, "SafetyProofVerified")
      .withArgs(user.address, signalHash, true);
  });

  it("reverts for invalid proof inputs", async function () {
    const { gateway } = await deployFixture();

    await expect(gateway.verifyPositionSafety(ethers.ZeroHash, "0x1234")).to.be.revertedWithCustomError(
      gateway,
      "InvalidInput"
    );

    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("health:ok"));
    await expect(gateway.verifyPositionSafety(signalHash, "0x")).to.be.revertedWithCustomError(
      gateway,
      "InvalidInput"
    );
  });

  it("reverts when verifier rejects proof", async function () {
    const { outsider, gateway } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("health:bad"));
    const invalidProof = await outsider.signMessage(ethers.getBytes(signalHash));

    await expect(gateway.verifyPositionSafety(signalHash, invalidProof)).to.be.revertedWithCustomError(
      gateway,
      "ProofRejected"
    );
  });
});