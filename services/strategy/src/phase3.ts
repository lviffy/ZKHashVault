import { calculateCreditScore, type WalletBehaviorSnapshot } from "./scoreEngine";
import { buildMockProof, buildSafetySignalHash, type SafetyProofInput } from "./safetyProof";

export function runPhase3CreditAndZkStep(input: {
  walletSnapshot: WalletBehaviorSnapshot;
  safetyInput: SafetyProofInput;
}) {
  const creditScore = calculateCreditScore(input.walletSnapshot);
  const signalHash = buildSafetySignalHash(input.safetyInput);
  const proof = buildMockProof(input.safetyInput);

  return {
    creditScore,
    signalHash,
    proof,
  };
}
