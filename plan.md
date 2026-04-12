# AdaptiveVault Development Plan

Date: 2026-04-12
Track: DeFi

## 1. MVP Outcome
Deliver an end-to-end flow where a user deposits assets, receives AI-guided rebalance updates, and verifies position safety with a ZK proof.

## 2. Scope Lock
- ERC-4626-style vault deposit/withdraw.
- Off-chain strategy policy updates.
- On-chain rebalance execution among predefined pools.
- Credit score NFT (mock model).
- One ZK proof flow for liquidation-threshold safety.
- Dashboard with APY, risk score, and rebalance timeline.

## 3. Build Plan

### Phase 1: Core Contracts (Day 1)
- Implement vault contract with safe deposit/withdraw paths.
- Add role-based admin policy update controls.
- Add event emissions for all user and rebalance actions.
- Write focused tests for:
  - Deposit/withdraw correctness
  - Rebalance guardrails
  - Invalid oracle input reverts

### Phase 2: Strategy + Execution (Day 2 Morning)
- Build strategy service (TypeScript API) with configurable cadence.
- Implement policy output format and validation checks.
- Add execution worker that submits rebalance transactions.
- Cache latest strategy snapshot for frontend reads.

### Phase 3: Credit + ZK (Day 2 Afternoon)
- Mint and update score NFT from wallet behavior snapshot data.
- Implement single circuit for position safety proof.
- Wire verifier contract and proof verification event logging.

### Phase 4: Frontend + Integration (Day 3 Morning)
- Build wallet-connected dashboard pages:
  - Deposit/withdraw actions
  - APY + risk widgets
  - Rebalance history panel
  - ZK verification status
- Connect to indexed events for timeline rendering.

### Phase 5: Demo Hardening (Day 3 Afternoon)
- Validate full script: deposit -> rebalance -> proof verification.
- Add fallback behavior for stale/failed strategy updates.
- Freeze UI and prepare demo artifacts (tx hashes, screenshots).

## 4. Task Ownership Suggestion
- Smart Contracts: vault, verifier, score NFT.
- Backend/AI: strategy service, executor, scoring baseline.
- Frontend: dashboard, wallet integration, status UX.
- QA/Demo: test script, regression checks, narration flow.

## 5. Acceptance Checklist
- Deposit and withdraw succeed on testnet.
- At least one rebalance transaction executes from policy service.
- Score NFT is minted and visible in UI.
- ZK verification transaction succeeds and is surfaced in timeline.
- End-to-end demo runs in under 8 minutes.
