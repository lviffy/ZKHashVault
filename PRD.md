# Product Requirements Document (PRD)
## Project: AdaptiveVault
## Track: DeFi

## 1. Product Summary
AdaptiveVault is an AI-assisted DeFi vault that dynamically adjusts lending and yield strategy based on market and wallet behavior. It aims to improve user returns while reducing liquidation risk through automated rebalancing and policy controls.

## 2. Problem Statement
DeFi users struggle to continuously optimize rates, collateral levels, and risk exposure across volatile market conditions. Manual management leads to missed yield opportunities and liquidation events.

## 3. Goals
- Deliver an autonomous vault strategy engine for lending and yield optimization.
- Provide transparent risk posture and rebalancing actions.
- Demonstrate privacy-preserving risk assurances via ZK proofs.
- Support cross-border yield intent routing for HK and India use cases.

## 4. Non-Goals
- Full production-grade credit underwriting.
- Multi-chain generalized routing beyond hackathon scope.
- Institutional custody integrations.

## 5. Target Users
- Retail DeFi users seeking better risk-adjusted yield.
- Crypto-native traders managing multiple positions.
- Early-stage funds testing automated strategy vaults.

## 6. User Stories
- As a user, I can deposit stable assets into a vault and set risk preferences.
- As a user, I can submit a natural-language intent for yield allocation.
- As a user, I can view why a rebalance happened and expected impact.
- As a user, I can prove my position health without exposing my full portfolio.

## 7. MVP Scope (Hackathon)
- ERC-4626-style vault contract for deposit and withdraw.
- AI Layer: Gemini agent acts as an oracle, suggesting rate and allocation adjustments.
- On-chain execution module for rebalance actions.
- Basic DeFi Credit Score NFT (mock scoring model).
- ZK proof demo: position safety proof for liquidation threshold.
- Dashboard showing APY, risk score, and recent strategy changes.

## 8. Key Functional Requirements
- Users can deposit and withdraw supported assets.
- Strategy engine publishes periodic allocation updates.
- Vault can rebalance among predefined pools or instruments.
- Credit score NFT is minted and updated from wallet behavior snapshots.
- ZK verifier contract accepts proof and emits verification result.
- Events are indexed for audit-friendly action timeline.

## 9. Non-Functional Requirements
- Rebalance action confirmation under 30 seconds on testnet.
- Strategy update cadence configurable (for example, every 10 minutes).
- Contract operations revert safely on invalid oracle input.
- Basic role-based access for admin policy updates.

## 10. Tech Stack
- Smart contracts: Solidity, OpenZeppelin, Foundry.
- ZK tooling: Circom, snarkjs, Groth16 verifier contracts.
- Backend and agents: TypeScript (Node.js), Fastify, ethers.
- AI and analytics: Google Gemini 2.0 Flash API for live, agentic allocation logic.
- Data and indexing: The Graph (or lightweight custom indexer), Redis cache.
- Frontend: Next.js, wagmi, viem, Tailwind CSS.
- Infra and devops: Docker, GitHub Actions, Vercel for frontend hosting.

## 11. Architecture
- User Layer: Wallet-connected web app for deposit, withdraw, and intent input.
- Application Layer: API service accepts intents, computes policy updates, and queues rebalance actions.
- AI Layer: Gemini API agent computes strategy weights based on market and portfolio features.
- Execution Layer: Policy executor submits signed transactions to vault and routing contracts.
- Blockchain Layer: ERC-4626 vault, score NFT contract, and ZK verifier enforce on-chain rules.
- Data Layer: Event indexer stores vault activity, APY snapshots, and rebalance history for dashboards.

## 12. Milestones (72 Hours)
- Day 1: Contracts scaffolded, deposit and withdraw flow working.
- Day 2: AI policy integration, rebalance transactions, score NFT.
- Day 3: ZK demo, frontend polish, end-to-end demo recording.

## 13. Success Metrics
- End-to-end deposit to rebalance demo completed live.
- At least one intent-based route execution shown.
- ZK verification transaction succeeds on-chain.
- Clear improvement in simulated yield versus static baseline.

## 14. Risks and Mitigations
- Risk: unreliable market feed.
  Mitigation: fallback feed and guardrails on extreme updates.
- Risk: strategy overfitting.
  Mitigation: fixed safety constraints and maximum rebalance delta.
- Risk: ZK integration complexity.
  Mitigation: scoped single proof flow with mock witness pipeline.

## 15. Open Questions
- Which exact pools and assets should be included for demo reliability?
- How often should score updates be refreshed in MVP?
- Should intent routing be fully automated or user-confirmed each time?
