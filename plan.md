# AdaptiveVault MVP Plan

Date: 2026-04-12

## Outcome
Ship a verifiable risk-constrained vault flow where strategy output is bounded by contract-level policy checks and surfaced in the dashboard.

## Completed In This Pass
- [x] Vault policy constraints enforced in `rebalance`:
  - max allocation delta = 20% (`MAX_ALLOCATION_DELTA_BPS`)
  - max slippage = 0.5% (`MAX_SLIPPAGE_BPS`)
  - minimum health factor = 1.2x (`MIN_HEALTH_FACTOR_WAD`)
  - oracle freshness window = 60s (`MAX_ORACLE_STALENESS_SECONDS`)
- [x] Strategy scoring aligned to README model:
  - risk score = 60% volatility + 40% utilization
  - risk classes: low/medium/high
  - actions: hold / reduce risky allocation up to 10% / reduce up to 20%
- [x] Strategy instruction path expanded to carry policy-execution fields:
  - `slippageBps`, `healthFactorWad`, `oracleTimestamp`
- [x] Proof-gateway test harness added with a real signature verifier contract.
- [x] Hardhat deployment script writes `deployments/<chain-id>.json` manifest for live networks.
- [x] Environment template added for deployer, execution worker, and proof signer keys.
- [x] Hardhat tests and lint are green.

## Current Status By Phase

### Phase 1: Contracts
- [x] Vault deposit/withdraw and share accounting.
- [x] Role-restricted policy updater.
- [x] Rebalance guardrails and oracle bounds checks.
- [x] Gateway contract for safety proof submission.

### Phase 2: Strategy + Execution
- [x] Weighted risk scoring + risk class policy derivation.
- [x] Policy validation for oracle range, staleness, slippage, and health constraints.
- [x] Rebalance instruction builder + real EVM execution worker.
- [x] Snapshot cache.

### Phase 3: Credit + ZK
- [x] Credit score model baseline and Phase 3 integration function.
- [x] Safety signal hash + cryptographic proof-signing flow.
- [x] On-chain gateway verification flow tested with real verifier logic.
- [x] Circom health-check circuit and Groth16 setup/prove scripts added.
- [x] Generated proving artifacts and integrated generated Groth16 verifier into contracts + tests.
- [ ] Deploy Groth16 verifier stack on target network and update production deployment manifest.

### Phase 4: Frontend + Integration
- [x] Dashboard surfaces strategy output and proof payload.
- [x] Wallet connect + live contract reads/writes for deposit/withdraw.
- [x] Rebalance history sourced from indexed events.
- [x] One-click proof submission transaction flow.

### Phase 5: Demo Hardening
- [x] Full e2e script on testnet: deposit -> rebalance -> verify proof.
- [x] Failure-mode handling for stale oracle / policy rejection in UI.
- [ ] Demo evidence pack (tx hashes, screenshots, short runbook).

## Immediate Next Steps
1. Wire frontend actions to deployed contracts (deposit, withdraw, verify proof).
2. Add integration tests that assert strategy instruction fields match vault guardrails.
3. Deploy Groth16 verifier stack on target network and commit `deployments/<chain-id>.json`.
