import type { RebalanceInstruction } from "./types";

export interface VaultExecutor {
  submitRebalance(deltaPoolABps: number, oraclePrice: number): Promise<string>;
}

export class MockVaultExecutor implements VaultExecutor {
  async submitRebalance(deltaPoolABps: number, oraclePrice: number): Promise<string> {
    const nonce = Math.abs(deltaPoolABps * 31 + oraclePrice).toString(16);
    return `0xrebalance${nonce.padStart(8, "0")}`;
  }
}

export async function executeRebalance(
  executor: VaultExecutor,
  instruction: RebalanceInstruction
): Promise<{ txHash: string; queuedAt: number }> {
  const txHash = await executor.submitRebalance(instruction.deltaPoolABps, instruction.oraclePrice);
  return {
    txHash,
    queuedAt: Date.now(),
  };
}
