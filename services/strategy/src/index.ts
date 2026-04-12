import { buildRebalanceInstruction, derivePolicy, validatePolicy } from "./policyEngine";
import { executeRebalance, MockVaultExecutor } from "./executionWorker";
import { StrategySnapshotCache } from "./snapshotCache";
import type { MarketSnapshot, StrategyConfig } from "./types";

export async function runStrategyTick(input: {
  snapshot: MarketSnapshot;
  currentPoolABps: number;
  config: StrategyConfig;
  cache: StrategySnapshotCache;
}) {
  const policy = derivePolicy(input.snapshot);
  const validation = validatePolicy(policy, input.config);

  if (!validation.ok) {
    return {
      ok: false,
      reason: validation.reason,
    };
  }

  input.cache.setLatest(policy);

  const instruction = buildRebalanceInstruction(input.currentPoolABps, policy, input.config);
  const receipt = await executeRebalance(new MockVaultExecutor(), instruction);

  return {
    ok: true,
    policy,
    instruction,
    receipt,
  };
}
