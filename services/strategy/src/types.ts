export type RiskBand = "low" | "medium" | "high";

export interface MarketSnapshot {
  timestamp: number;
  poolAApyBps: number;
  poolBApyBps: number;
  volatilityBps: number;
  utilizationBps: number;
  estimatedSlippageBps: number;
  positionHealthFactorBps: number;
  oraclePrice: number;
}

export interface StrategyConfig {
  cadenceSeconds: number;
  maxRebalanceDeltaBps: number;
  maxSlippageBps: number;
  minHealthFactorBps: number;
  maxOracleAgeSeconds: number;
  nowTimestamp: number;
  minOraclePrice: number;
  maxOraclePrice: number;
}

export interface StrategyPolicy {
  targetPoolABps: number;
  targetPoolBBps: number;
  expectedNetApyBps: number;
  riskClass: RiskBand;
  riskScore: number;
  proofRequired: boolean;
  estimatedSlippageBps: number;
  positionHealthFactorBps: number;
  oraclePrice: number;
  generatedAt: number;
}

export interface PolicyValidationResult {
  ok: boolean;
  reason?: string;
}

export interface RebalanceInstruction {
  deltaPoolABps: number;
  oraclePrice: number;
  slippageBps: number;
  healthFactorWad: string;
  oracleTimestamp: number;
  policyGeneratedAt: number;
}
