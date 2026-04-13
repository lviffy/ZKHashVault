import { Contract, JsonRpcProvider, Wallet } from "ethers";
import type { RebalanceInstruction } from "./types.ts";

const ADAPTIVE_VAULT_ABI = [
  "function rebalance(int256 deltaPoolABps, uint16 slippageBps, uint256 healthFactorWad, bytes32 signalHash, bytes calldata proof) external",
] as const;

export interface VaultExecutor {
  submitRebalance(
    deltaPoolABps: number,
    slippageBps: number,
    healthFactorWad: string,
    signalHash: string,
    proof: string
  ): Promise<string>;
}

export class EvmVaultExecutor implements VaultExecutor {
  private readonly vault: Contract;

  constructor(config: { rpcUrl: string; privateKey: string; vaultAddress: string }) {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer = new Wallet(config.privateKey, provider);
    this.vault = new Contract(config.vaultAddress, ADAPTIVE_VAULT_ABI, signer);
  }

  static fromEnv(): EvmVaultExecutor | null {
    const rpcUrl = process.env.STRATEGY_RPC_URL;
    const privateKey = process.env.STRATEGY_EXECUTOR_PRIVATE_KEY;
    const vaultAddress = process.env.ADAPTIVE_VAULT_ADDRESS;

    if (!rpcUrl || !privateKey || !vaultAddress) {
      return null;
    }

    return new EvmVaultExecutor({
      rpcUrl,
      privateKey,
      vaultAddress,
    });
  }

  async submitRebalance(
    deltaPoolABps: number,
    slippageBps: number,
    healthFactorWad: string,
    signalHash: string,
    proof: string
  ): Promise<string> {
    const tx = await this.vault.rebalance(
      deltaPoolABps,
      slippageBps,
      healthFactorWad,
      signalHash,
      proof
    );
    return tx.hash as string;
  }
}

export async function executeRebalance(
  executor: VaultExecutor,
  instruction: RebalanceInstruction,
  signalHash: string,
  proof: string
): Promise<{ txHash: string; queuedAt: number }> {
  const txHash = await executor.submitRebalance(
    instruction.deltaPoolABps,
    instruction.slippageBps,
    instruction.healthFactorWad,
    signalHash,
    proof
  );
  return {
    txHash,
    queuedAt: Date.now(),
  };
}
