# ZKHashVault — Deployed Contracts

**Network:** HashKey Testnet
**Chain ID:** `133`
**Deployed At:** `2026-04-15T07:05:40Z`
**Deployer:** `0xd5DB28C488747BEC4F588D4Ed9E521080295c12d`
**Explorer:** [testnet-explorer.hsk.xyz](https://testnet-explorer.hsk.xyz)

---

## Core Vault

| Contract | Address |
|---|---|
| `ZKHashVault` (Adaptive Vault) | [`0xEC4A4d4c41C09814f7878A71c58D35637f9FecD6`](https://testnet-explorer.hsk.xyz/address/0xEC4A4d4c41C09814f7878A71c58D35637f9FecD6) |
| `VaultAssetToken` (avUSD) | [`0x895a0Dc6639AF9dbcB8Bfe6a5De3e0ab172965f4`](https://testnet-explorer.hsk.xyz/address/0x895a0Dc6639AF9dbcB8Bfe6a5De3e0ab172965f4) |

---

## ZK Proof & Safety Layer

| Contract | Purpose | Address |
|---|---|---|
| `PositionSafetyGateway` | Enforces ZK proof verification before any rebalance executes | [`0x3A257b92ab97748B5392Ab6Dc6fa8A2f24E88Fd5`](https://testnet-explorer.hsk.xyz/address/0x3A257b92ab97748B5392Ab6Dc6fa8A2f24E88Fd5) |
| `Groth16SafetyProofVerifier` | Decodes Groth16 proof payload and calls generated verifier | [`0x281C6ff93871d6C555680471e096B69611Fc916A`](https://testnet-explorer.hsk.xyz/address/0x281C6ff93871d6C555680471e096B69611Fc916A) |
| `HealthCheckGroth16Verifier` | Auto-generated Groth16 on-chain verifier (health check circuit) | [`0x6766cFaA46088197333e16Bd4e5DCcE40E50D2C3`](https://testnet-explorer.hsk.xyz/address/0x6766cFaA46088197333e16Bd4e5DCcE40E50D2C3) |
| `SafetyProofVerifier` (ECDSA) | Fallback verifier for resilience when ZK path is unavailable | [`0xAd3259bE985ca875B7F24CebB088E946F1E6ceC8`](https://testnet-explorer.hsk.xyz/address/0xAd3259bE985ca875B7F24CebB088E946F1E6ceC8) |

---

## Credit & Identity

| Contract | Purpose | Address |
|---|---|---|
| `CreditScorePassport` | On-chain credit scoring NFT for credit-aware capital routing | [`0x41cE5735511D96a3F6e244f54e613327971026b2`](https://testnet-explorer.hsk.xyz/address/0x41cE5735511D96a3F6e244f54e613327971026b2) |

---

## Pool Adapters

| Contract | Purpose | Address |
|---|---|---|
| `HashKeyLendingAdapter` (Pool A) | Native HashKey Chain lending protocol integration | [`0xCe928a7dB051aB532E701b17Ac003C1f2514b3cB`](https://testnet-explorer.hsk.xyz/address/0xCe928a7dB051aB532E701b17Ac003C1f2514b3cB) |
| `Pool B Adapter` | Secondary yield pool adapter | [`0xd5E6D7f526032E0EC31579D336Fa91FEc731eF4C`](https://testnet-explorer.hsk.xyz/address/0xd5E6D7f526032E0EC31579D336Fa91FEc731eF4C) |

---

## Deployment Configuration

| Parameter | Value |
|---|---|
| Policy Updater | `0xd5DB28C488747BEC4F588D4Ed9E521080295c12d` |
| Proof Signer | `0xd5DB28C488747BEC4F588D4Ed9E521080295c12d` |
| Passport Owner | `0xd5DB28C488747BEC4F588D4Ed9E521080295c12d` |
| Initial Mint | `1,000,000 avUSD` |

---

> Full deployment manifest: [`deployments/133.json`](./deployments/133.json)
