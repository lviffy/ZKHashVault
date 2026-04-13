import { parseUnits } from "ethers";
import type {
  MarketSnapshot,
  PolicyValidationResult,
  RebalanceInstruction,
  StrategyConfig,
  StrategyPolicy,
} from "./types.ts";

const BPS = 10_000;

function clampBps(value: number): number {
  return Math.min(BPS, Math.max(0, value));
}

function bpsToRiskScore(valueBps: number): number {
  return Math.round((clampBps(valueBps) * 100) / BPS);
}

function toWadFromBps(valueBps: number): string {
  // Health factors can exceed 10000 bps (1.0), so we only bound the lower limit to 0
  const normalized = (Math.max(0, valueBps) / BPS).toFixed(4);
  return parseUnits(normalized, 18).toString();
}

function computeRiskReductionBps(riskScore: number): number {
  if (riskScore <= 30) {
    return 0;
  }

  if (riskScore <= 60) {
    return Math.min(1_000, Math.round(((riskScore - 31) / 29) * 1_000));
  }

  return Math.min(2_000, Math.round(((riskScore - 61) / 39) * 2_000));
}

export function derivePolicy(snapshot: MarketSnapshot, currentPoolABps: number): StrategyPolicy {
  const volatilityScore = bpsToRiskScore(snapshot.volatilityBps);
  const utilizationScore = bpsToRiskScore(snapshot.utilizationBps);
  const riskScore = Math.round(volatilityScore * 0.6 + utilizationScore * 0.4);

  const riskClass = riskScore <= 30 ? "low" : riskScore <= 60 ? "medium" : "high";
  const riskReductionBps = computeRiskReductionBps(riskScore);
  const targetPoolABps = Math.max(0, clampBps(currentPoolABps) - riskReductionBps);

  const targetPoolBBps = BPS - targetPoolABps;
  const expectedNetApyBps = Math.floor(
    (targetPoolABps * snapshot.poolAApyBps + targetPoolBBps * snapshot.poolBApyBps) / BPS
  );

  return {
    targetPoolABps,
    targetPoolBBps,
    expectedNetApyBps,
    riskClass,
    riskScore,
    proofRequired: riskClass === "high",
    estimatedSlippageBps: snapshot.estimatedSlippageBps,
    positionHealthFactorBps: snapshot.positionHealthFactorBps,
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

  if (policy.estimatedSlippageBps < 0 || policy.estimatedSlippageBps > config.maxSlippageBps) {
    return { ok: false, reason: "estimated slippage exceeds cap" };
  }

  if (policy.positionHealthFactorBps < config.minHealthFactorBps) {
    return { ok: false, reason: "health factor below policy minimum" };
  }

  if (policy.generatedAt > config.nowTimestamp) {
    return { ok: false, reason: "policy timestamp is in the future" };
  }

  if (config.nowTimestamp - policy.generatedAt > config.maxOracleAgeSeconds) {
    return { ok: false, reason: "oracle snapshot is stale" };
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
    slippageBps: policy.estimatedSlippageBps,
    healthFactorWad: toWadFromBps(policy.positionHealthFactorBps),
    oracleTimestamp: policy.generatedAt,
    policyGeneratedAt: policy.generatedAt,
  };
}

export async function deriveGeminiPolicy(currentPoolABps: number, riskClass: string) {
  // Stub placeholder for Gemini integration logic
  // Connects Gemini to the policy engine replacing deterministic derivePolicy
  return null;
}
