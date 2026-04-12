import { createHash } from "node:crypto";

export interface SafetyProofInput {
  collateralUsd: string;
  debtUsd: string;
  liquidationThresholdBps: number;
}

export function buildSafetySignalHash(input: SafetyProofInput): string {
  const payload = `${input.collateralUsd}:${input.debtUsd}:${input.liquidationThresholdBps}`;
  return `0x${createHash("sha256").update(payload).digest("hex")}`;
}

export function buildMockProof(input: SafetyProofInput): string {
  const payload = JSON.stringify(input);
  return `0x${Buffer.from(payload, "utf8").toString("hex")}`;
}
