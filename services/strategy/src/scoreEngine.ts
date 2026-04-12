export interface WalletBehaviorSnapshot {
  repaymentRatioBps: number;
  liquidationCount: number;
  positionHealthBps: number;
  activityScoreBps: number;
}

export function calculateCreditScore(snapshot: WalletBehaviorSnapshot): number {
  const repaymentWeight = 0.4;
  const healthWeight = 0.3;
  const activityWeight = 0.2;
  const liquidationPenaltyWeight = 0.1;

  const normalizedRepayment = Math.min(10_000, Math.max(0, snapshot.repaymentRatioBps));
  const normalizedHealth = Math.min(10_000, Math.max(0, snapshot.positionHealthBps));
  const normalizedActivity = Math.min(10_000, Math.max(0, snapshot.activityScoreBps));
  const liquidationPenalty = Math.min(10_000, snapshot.liquidationCount * 1_500);

  const rawScore =
    normalizedRepayment * repaymentWeight +
    normalizedHealth * healthWeight +
    normalizedActivity * activityWeight -
    liquidationPenalty * liquidationPenaltyWeight;

  return Math.max(0, Math.min(1000, Math.round(rawScore / 10)));
}
