import { calculateCreditScore, type WalletBehaviorSnapshot } from "./scoreEngine";
import {
  buildGroth16SafetyProofPayload,
  buildSafetySignalHash,
  buildSignedSafetyProof,
  type SafetyProofInput,
} from "./safetyProof";

export async function runPhase3CreditAndZkStep(input: {
  walletSnapshot: WalletBehaviorSnapshot;
  safetyInput: SafetyProofInput;
  useEcdsaFallback?: boolean;
  proverPrivateKey?: string;
}) {
  const creditScore = calculateCreditScore(input.walletSnapshot);
  const signalHash = buildSafetySignalHash(input.safetyInput);
  let proof: string | null = null;

  try {
    proof = await buildGroth16SafetyProofPayload(signalHash);
  } catch {
    if (input.useEcdsaFallback && input.proverPrivateKey) {
      proof = await buildSignedSafetyProof(input.safetyInput, input.proverPrivateKey);
    }
  }

  return {
    creditScore,
    signalHash,
    proof,
    proofReady: proof !== null,
  };
}
