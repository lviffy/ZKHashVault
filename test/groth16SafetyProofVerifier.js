const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 3: Groth16SafetyProofVerifier", function () {
  const PROOF = {
    pA: [
      "20782725936114295934261193511595606147421503330653401876589286834938689259440",
      "4300886557132468406208543868306154910145077345467784924682289630543546390832",
    ],
    pB: [
      [
        "1834890847062790643247121504636320531743556993757939393317072920459314239475",
        "21059198897325669486742540213021699850605035949948783252718394835015988168249",
      ],
      [
        "21223492997780418321443516228219624122912720382181221709916506411148522152475",
        "14240573143529314514890518416266639668457716854278391933358843156593260403592",
      ],
    ],
    pC: [
      "20801525395180992191047798605176303454376659854630409679163123440784142995731",
      "4049444407677341596188649605960045786742841238055186692731047843597301105287",
    ],
    pubSignals: ["1"],
  };

  async function deployFixture() {
    const [user] = await ethers.getSigners();

    const GeneratedFactory = await ethers.getContractFactory("Groth16Verifier");
    const generatedVerifier = await GeneratedFactory.deploy();

    const AdapterFactory = await ethers.getContractFactory("Groth16SafetyProofVerifier");
    const adapter = await AdapterFactory.deploy(await generatedVerifier.getAddress());

    const GatewayFactory = await ethers.getContractFactory("PositionSafetyGateway");
    const gateway = await GatewayFactory.deploy(await adapter.getAddress());

    return { user, adapter, gateway };
  }

  function encodePayload(signalHash, overrides = {}) {
    const payload = {
      pA: overrides.pA ?? PROOF.pA,
      pB: overrides.pB ?? PROOF.pB,
      pC: overrides.pC ?? PROOF.pC,
      pubSignals: overrides.pubSignals ?? PROOF.pubSignals,
      signalHash,
    };

    const coder = ethers.AbiCoder.defaultAbiCoder();
    return coder.encode(
      ["tuple(uint256[2] pA,uint256[2][2] pB,uint256[2] pC,uint256[1] pubSignals,bytes32 signalHash)"],
      [payload]
    );
  }

  it("accepts a real Groth16 proof payload", async function () {
    const { user, adapter, gateway } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("health-check-snapshot:1"));
    const encodedProof = encodePayload(signalHash);

    expect(await adapter.verify(signalHash, encodedProof)).to.equal(true);

    await expect(gateway.connect(user).verifyPositionSafety(signalHash, encodedProof))
      .to.emit(gateway, "SafetyProofVerified")
      .withArgs(user.address, signalHash, true);
  });

  it("rejects payload when signal hash does not match", async function () {
    const { adapter, gateway } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("health-check-snapshot:2"));
    const wrongSignalHash = ethers.keccak256(ethers.toUtf8Bytes("health-check-snapshot:3"));
    const encodedProof = encodePayload(wrongSignalHash);

    expect(await adapter.verify(signalHash, encodedProof)).to.equal(false);

    await expect(gateway.verifyPositionSafety(signalHash, encodedProof)).to.be.revertedWithCustomError(
      gateway,
      "ProofRejected"
    );
  });

  it("rejects payload when public signal is tampered", async function () {
    const { adapter, gateway } = await deployFixture();
    const signalHash = ethers.keccak256(ethers.toUtf8Bytes("health-check-snapshot:4"));
    const encodedProof = encodePayload(signalHash, { pubSignals: ["0"] });

    expect(await adapter.verify(signalHash, encodedProof)).to.equal(false);

    await expect(gateway.verifyPositionSafety(signalHash, encodedProof)).to.be.revertedWithCustomError(
      gateway,
      "ProofRejected"
    );
  });
});
