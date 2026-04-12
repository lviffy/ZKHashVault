# AdaptiveVault

> A yield vault where risk constraints are cryptographically enforced on-chain — not just promised.

---

## Overview

AdaptiveVault is an AI-assisted DeFi yield vault that continuously balances return and liquidation risk through policy-driven automation and verifiable risk controls.

Most yield vaults ask users to trust that the protocol is managing risk responsibly. AdaptiveVault removes that assumption. Every rebalance is bounded by on-chain policy constraints. Every position can be proven safe via a ZK proof that any user can submit and verify independently.

---

## The Core Loop

```
Deposit → AI scores risk → Policy executes rebalance → ZK proof confirms safety → Dashboard reflects state
```

This loop is the product. Everything else is infrastructure in support of it.

---

## Problem

- Retail users react too slowly to market changes, often discovering risk only after a liquidation event.
- Static allocation strategies underperform in rotating yield environments.
- Most DeFi protocols ask users to trust off-chain risk management with no on-chain verifiability.
- Users want risk transparency but do not want to reveal full wallet positions to third parties.

---

## Solution

AdaptiveVault introduces a closed-loop optimization system with cryptographic enforcement at every layer:

1. Users deposit assets and select a risk profile.
2. A strategy engine ingests market and portfolio telemetry and computes risk class, target allocations, and rebalance bounds.
3. A policy executor contract accepts rebalance instructions **only if they stay within hardcoded on-chain bounds** — max allocation delta, slippage cap, minimum health factor.
4. Users can generate and submit a ZK proof verifying that their position satisfies predefined safety constraints, without revealing underlying portfolio details.
5. The dashboard reflects APY, risk score, health factor, and a full action timeline in real time.

---

## MVP Scope

The MVP is intentionally narrow. One complete, trustworthy flow is worth more than five incomplete features.

### What is included

- **ERC-4626 Vault** — deposit, withdraw, share accounting. Two allocation targets: a lending protocol and a stablecoin pool.
- **Policy Executor Contract** — on-chain enforcement of rebalance bounds. Max 20% allocation shift per rebalance, slippage cap, minimum health factor threshold. Rebalances that violate these constraints are rejected at the contract level.
- **Strategy Engine** — Uses the Google Gemini 2.0 Flash API to act as an autonomous risk-adjustment agent. It ingests price feeds and utilization rates, computes a weighted risk score, and outputs target allocations within policy bounds.
- **ZK Health Proof** — a Groth16 proof verifying that the current collateral ratio exceeds a minimum threshold. Verified on-chain. The verification transaction is publicly visible and linked from the dashboard.
- **Dashboard** — current APY, risk score, health factor, rebalance action timeline, and a one-click proof generation and submission flow.

### What is explicitly out of scope for MVP

| Feature | Status |
|---|---|
| Credit Score NFT | Phase 2 |
| Cross-chain routing | Phase 2 |
| Liquidation insurance pool | Phase 2 |
| ZK-proven model inference | Phase 2 |
| Intent / solver layer | Phase 2 |
| ML scoring model | Phase 2 |

---

## Architecture

```
User Wallet + Web App
        │
        ▼
Intent and Policy API
        │
        ├──────────────────────┐
        ▼                      ▼
Strategy and Scoring     ZK Prover (client-side)
Engine (off-chain)             │
        │                      ▼
        ▼              On-chain ZK Verifier
Execution Guard
and Relayer
        │
        ▼
ERC-4626 Vault Contract
        │
        ▼
Indexer and Analytics
        │
        ▼
Dashboard (real-time)
```

The strategy engine is off-chain but its recommendations are bounded by the on-chain policy executor. The executor is the trust anchor — users do not need to trust the strategy engine to be safe.

---

## Smart Contracts

| Contract | Responsibility |
|---|---|
| `Vault.sol` | ERC-4626 deposit, withdrawal, share accounting, allocation state |
| `PolicyExecutor.sol` | Validates and executes rebalance instructions within hardcoded policy bounds |
| `ZKVerifier.sol` | Accepts Groth16 proofs, validates health constraints, emits verification events |

### Policy Bounds (hardcoded in `PolicyExecutor.sol`)

```solidity
uint256 public constant MAX_ALLOCATION_DELTA = 2000;  // 20% in basis points
uint256 public constant MIN_HEALTH_FACTOR    = 1.2e18; // 1.2x
uint256 public constant MAX_SLIPPAGE         = 50;     // 0.5% in basis points
```

Any strategy instruction that violates these bounds is rejected at the contract level. The strategy engine cannot override them.

---

## ZK Risk Verification

The ZK layer proves a single statement for the MVP:

> *"The current collateral ratio of this position is greater than 1.2, without revealing the underlying position details."*

**Circuit:** Circom  
**Proving scheme:** Groth16  
**Verifier:** Solidity Groth16 verifier contract, deployed on-chain  

Users generate the proof client-side and submit it via the dashboard. The resulting verification transaction is publicly visible on the block explorer, providing a trustless audit trail of position safety.

---

## Tech Stack

**Smart Contracts**
- Solidity, OpenZeppelin, Foundry

**ZK Stack**
- Circom, snarkjs, Groth16 verifier contracts

**Backend Services**
- Node.js, TypeScript, Fastify, ethers.js

**Strategy Engine**
- Python, rule-based scoring (scikit-learn ready for Phase 2)

**Data Layer**
- The Graph (subgraph for vault events), Redis cache (analytics reads only, not on critical execution path)

**Frontend**
- Next.js, wagmi, viem, Tailwind CSS

**DevOps**
- Docker, GitHub Actions, Vercel

---

## Repository Layout

```
adaptivevault/
├── contracts/
│   ├── src/
│   │   ├── Vault.sol
│   │   ├── PolicyExecutor.sol
│   │   └── ZKVerifier.sol
│   └── test/
├── circuits/
│   ├── health_check.circom
│   └── artifacts/           # pre-generated proving artifacts
├── services/
│   ├── strategy/            # scoring and allocation engine
│   └── indexer/             # event processing and analytics endpoints
├── apps/
│   └── web/                 # Next.js dashboard
└── docs/
```

---

## Build and Run

### Prerequisites

- Node.js 18+
- Foundry
- Python 3.10+
- snarkjs
- circom

### Contracts

```bash
npm install
npm run contracts:compile
npm run contracts:test
```

### Strategy Service

```bash
cd services/strategy
pip install -r requirements.txt
python main.py
```

### ZK Circuits (Groth16)

```bash
npm run zk:setup
npm run zk:prove
npm run zk:sync-verifier
```

Generate custom circuit input:

```bash
npm run zk:build-input -- 125000 61000 12000 > circuits/inputs/health_check.custom.json
npm run zk:prove -- circuits/inputs/health_check.custom.json
npm run zk:encode-payload -- circuits/artifacts/proof/proof.json circuits/artifacts/proof/public.json 0x<signalHash>
```

### Indexer

```bash
cd services/indexer
npm install
npm run dev
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

---

## Deployment

### Testnet (HashKey)

```bash
cp .env.example .env
npm run contracts:deploy:hashkey
```

Contract addresses are written to `deployments/<chain-id>.json` and consumed by the frontend and indexer automatically.

### Runtime Environment (Strategy + Proofs)

Set the following values in your `.env` file for live execution:

- `STRATEGY_RPC_URL`
- `STRATEGY_EXECUTOR_PRIVATE_KEY`
- `ADAPTIVE_VAULT_ADDRESS`
- `SAFETY_PROVER_PRIVATE_KEY`
- `USE_ECDSA_PROOF_FALLBACK` (optional, defaults to `false`)

The strategy worker submits real `rebalance` transactions through `EvmVaultExecutor`.

For proof verification, deployment now includes:

- `Groth16Verifier` generated from the Circom circuit.
- `Groth16SafetyProofVerifier` adapter implementing `verify(bytes32,bytes)`.
- `PositionSafetyGateway` pointed at the Groth16 adapter.

`SafetyProofVerifier` (ECDSA-based) is also deployed as a fallback verifier contract.

To submit a Groth16 proof through the gateway, encode generated proof artifacts into the gateway payload bytes:

```bash
npm run zk:encode-payload -- circuits/artifacts/proof/proof.json circuits/artifacts/proof/public.json 0x<signalHash>
```

---

## Risk Model (MVP)

The strategy engine computes a risk score as a weighted combination of two signals:

| Signal | Weight | Source |
|---|---|---|
| 30-day price volatility | 60% | Price feed (Chainlink / Pyth) |
| Protocol utilization rate | 40% | On-chain read |

**Risk classes:**

| Score | Class | Action |
|---|---|---|
| 0 – 30 | Low | Hold current allocation |
| 31 – 60 | Medium | Reduce risky allocation by up to 10% |
| 61 – 100 | High | Reduce risky allocation by up to 20%, trigger proof prompt |

All rebalance instructions are passed through the policy executor before any on-chain action is taken.

---

## Security Considerations

- **Oracle risk** — price feed manipulation is mitigated by requiring freshness checks (max staleness: 60 seconds) before any rebalance executes.
- **ERC-4626 inflation attack** — mitigated by using OpenZeppelin's ERC-4626 implementation with virtual shares offset.
- **Strategy engine compromise** — the policy executor enforces bounds regardless of strategy engine output. A compromised or malfunctioning strategy engine cannot execute unsafe rebalances.
- **No upgradeability in MVP** — contracts are immutable. An upgrade path will be designed for v2 with a timelock.

---

## Roadmap

### Phase 1 — MVP (current)
Vault, policy executor, rule-based strategy engine, ZK health proof, dashboard.

### Phase 2 — Differentiation
- ZK-proven model inference (EZKL / Risc Zero)
- Commit-reveal for strategy recommendations
- Credit history soulbound token
- Adversarial simulation engine (stress-test rebalances against historical scenarios)

### Phase 3 — Moat
- Intent layer with solver network (ERC-7521 aligned)
- Liquidation insurance pool
- Private rebalancing via ZK

### Phase 4 — Expansion
- Cross-chain yield routing (LayerZero / Hyperlane)
- Undercollateralized lending using on-chain credit history
- Third-party protocol integrations

---

## License

MIT