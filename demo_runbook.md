# AdaptiveVault MVP Demo Runbook

## Overview
This runbook demonstrates the full lifecycle of the AdaptiveVault smart yield optimizer running on the **Hashkey Testnet** (Chain ID: 133). 

1. User deposits standard yield-bearing testnet tokens into the intelligent `AdaptiveVault` contract.
2. The off-chain strategy engine executes a tick to measure risk (using market volatility and pool utilization).
3. The engine produces a state delta (e.g. `rebalance -11.79% pool A limit slippage 0.5% min health factor 1.2x`).
4. A Zero-Knowledge `Groth16` proof is created confirming the execution does not violate extreme health factor constraints.
5. The transaction is submitted on-chain where the Vault accepts and natively validates the ZK proof before initiating the reallocation logic.

## Transaction Evidence

*   **Contract Deployment (AdaptiveVault):** `0xEC4A4d4c41C09814f7878A71c58D35637f9FecD6`
*   **User Vault Deposit:** `0xe6662c35edc4fc6091567863f203e242c98c3c9c42a7a1ecf56c992db09c57de`
*   **Strategy Rebalance & Zk-Proof Gateway Execution:** `0x34fd7d29d2248a19e94424b5a48ea6bf3dacab3b423637ab08393cafcef3df1a`

The end-to-end suite natively demonstrates the product loop of `Deposit -> AI Allocation Check -> Zk-proof Creation -> Smart Contract Guardrails -> Capital Allocation.`
