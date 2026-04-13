import { buildRebalanceInstruction, derivePolicy, validatePolicy } from "./policyEngine.ts";
import { executeRebalance, type VaultExecutor } from "./executionWorker.ts";
import { StrategySnapshotCache } from "./snapshotCache.ts";
import type { MarketSnapshot, StrategyConfig } from "./types.ts";

export async function runStrategyTick(input: {
  snapshot: MarketSnapshot;
  currentPoolABps: number;
  config: StrategyConfig;
  cache: StrategySnapshotCache;
  executor?: VaultExecutor;
  signalHash?: string;
  proof?: string;
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
  let receipt = null;
  if (input.executor && input.signalHash && input.proof) {
    receipt = await executeRebalance(input.executor, instruction, input.signalHash, input.proof);
  }

  return {
    ok: true,
    policy,
    instruction,
    receipt,
    executed: receipt !== null,
  };
}
