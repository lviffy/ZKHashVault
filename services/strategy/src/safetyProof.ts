import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { AbiCoder, Wallet, getBytes } from "ethers";

export interface SafetyProofInput {
  collateralUsd: string;
  debtUsd: string;
  liquidationThresholdBps: number;
}

export function buildSafetySignalHash(input: SafetyProofInput): string {
  const payload = `${input.collateralUsd}:${input.debtUsd}:${input.liquidationThresholdBps}`;
  return `0x${createHash("sha256").update(payload).digest("hex")}`;
}

interface Groth16ProofJson {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
}

export interface Groth16ArtifactPaths {
  proofPath: string;
  publicSignalsPath: string;
}

const DEFAULT_GROTH16_ARTIFACTS: Groth16ArtifactPaths = {
  proofPath: path.resolve(process.cwd(), "circuits/artifacts/proof/proof.json"),
  publicSignalsPath: path.resolve(process.cwd(), "circuits/artifacts/proof/public.json"),
};

export async function buildGroth16SafetyProofPayload(
  signalHash: string,
  artifactPaths: Groth16ArtifactPaths = DEFAULT_GROTH16_ARTIFACTS
): Promise<string> {
  const proofRaw = await readFile(artifactPaths.proofPath, "utf8");
  const publicRaw = await readFile(artifactPaths.publicSignalsPath, "utf8");

  const proofJson = JSON.parse(proofRaw) as Groth16ProofJson;
  const publicSignals = JSON.parse(publicRaw) as string[];

  if (!Array.isArray(publicSignals) || publicSignals.length !== 1) {
    throw new Error("Expected exactly one public signal for health_check circuit");
  }

  const payload = {
    pA: [proofJson.pi_a[0], proofJson.pi_a[1]],
    pB: [
      [proofJson.pi_b[0][1], proofJson.pi_b[0][0]],
      [proofJson.pi_b[1][1], proofJson.pi_b[1][0]],
    ],
    pC: [proofJson.pi_c[0], proofJson.pi_c[1]],
    pubSignals: [publicSignals[0]],
    signalHash,
  };

  const coder = AbiCoder.defaultAbiCoder();
  return coder.encode(
    ["tuple(uint256[2] pA,uint256[2][2] pB,uint256[2] pC,uint256[1] pubSignals,bytes32 signalHash)"],
    [payload]
  );
}

export async function buildSignedSafetyProof(input: SafetyProofInput, proverPrivateKey: string): Promise<string> {
  const signalHash = buildSafetySignalHash(input);
  const prover = new Wallet(proverPrivateKey);

  return prover.signMessage(getBytes(signalHash));
}
