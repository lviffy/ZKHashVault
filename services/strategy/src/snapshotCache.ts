import type { StrategyPolicy } from "./types";

export class StrategySnapshotCache {
  private latestPolicy: StrategyPolicy | null = null;

  setLatest(policy: StrategyPolicy): void {
    this.latestPolicy = policy;
  }

  getLatest(): StrategyPolicy | null {
    return this.latestPolicy;
  }
}
