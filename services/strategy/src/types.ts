export type RiskBand = "conservative" | "balanced" | "aggressive";

export interface MarketSnapshot {
  timestamp: number;
  poolAApyBps: number;
  poolBApyBps: number;
  volatilityBps: number;
  oraclePrice: number;
}

export interface StrategyConfig {
  cadenceSeconds: number;
  maxRebalanceDeltaBps: number;
  minOraclePrice: number;
  maxOraclePrice: number;
}

export interface StrategyPolicy {
  targetPoolABps: number;
  targetPoolBBps: number;
  expectedNetApyBps: number;
  riskBand: RiskBand;
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
  policyGeneratedAt: number;
}
