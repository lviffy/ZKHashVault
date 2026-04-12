import type {
  MarketSnapshot,
  PolicyValidationResult,
  RebalanceInstruction,
  StrategyConfig,
  StrategyPolicy,
} from "./types";

const BPS = 10_000;

export function derivePolicy(snapshot: MarketSnapshot): StrategyPolicy {
  const spread = snapshot.poolAApyBps - snapshot.poolBApyBps;

  let targetPoolABps = 5_000;
  if (spread >= 200) {
    targetPoolABps = 6_000;
  } else if (spread <= -200) {
    targetPoolABps = 4_000;
  }

  if (snapshot.volatilityBps > 700) {
    targetPoolABps = 5_000;
  }

  const targetPoolBBps = BPS - targetPoolABps;
  const expectedNetApyBps = Math.floor(
    (targetPoolABps * snapshot.poolAApyBps + targetPoolBBps * snapshot.poolBApyBps) / BPS
  );

  const riskBand =
    snapshot.volatilityBps > 800 ? "conservative" : snapshot.volatilityBps < 400 ? "aggressive" : "balanced";

  return {
    targetPoolABps,
    targetPoolBBps,
    expectedNetApyBps,
    riskBand,
    oraclePrice: snapshot.oraclePrice,
    generatedAt: snapshot.timestamp,
  };
}

export function validatePolicy(policy: StrategyPolicy, config: StrategyConfig): PolicyValidationResult {
  if (policy.targetPoolABps < 0 || policy.targetPoolABps > BPS) {
    return { ok: false, reason: "targetPoolABps out of range" };
  }
  if (policy.targetPoolABps + policy.targetPoolBBps !== BPS) {
    return { ok: false, reason: "allocation must sum to 10000 bps" };
  }
  if (policy.oraclePrice < config.minOraclePrice || policy.oraclePrice > config.maxOraclePrice) {
    return { ok: false, reason: "oracle price out of configured range" };
  }

  return { ok: true };
}

export function buildRebalanceInstruction(
  currentPoolABps: number,
  policy: StrategyPolicy,
  config: StrategyConfig
): RebalanceInstruction {
  const rawDelta = policy.targetPoolABps - currentPoolABps;
  const boundedDelta = Math.max(-config.maxRebalanceDeltaBps, Math.min(config.maxRebalanceDeltaBps, rawDelta));

  return {
    deltaPoolABps: boundedDelta,
    oraclePrice: policy.oraclePrice,
    policyGeneratedAt: policy.generatedAt,
  };
}
