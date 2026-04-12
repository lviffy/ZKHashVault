import { buildRebalanceInstruction, derivePolicy, validatePolicy } from "./policyEngine";
import { executeRebalance, type VaultExecutor } from "./executionWorker";
import { StrategySnapshotCache } from "./snapshotCache";
import type { MarketSnapshot, StrategyConfig } from "./types";

export async function runStrategyTick(input: {
  snapshot: MarketSnapshot;
  currentPoolABps: number;
  config: StrategyConfig;
  cache: StrategySnapshotCache;
  executor?: VaultExecutor;
}) {
  const policy = derivePolicy(input.snapshot, input.currentPoolABps);
  const validation = validatePolicy(policy, input.config);

  if (!validation.ok) {
    return {
      ok: false,
      reason: validation.reason,
    };
  }

  input.cache.setLatest(policy);

  const instruction = buildRebalanceInstruction(input.currentPoolABps, policy, input.config);
  const receipt = input.executor ? await executeRebalance(input.executor, instruction) : null;

  return {
    ok: true,
    policy,
    instruction,
    receipt,
    executed: receipt !== null,
  };
}
