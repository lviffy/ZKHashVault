# AdaptiveVault Circuits

This folder contains the Groth16 circuit flow for position health checks.

## Circuit

- `health_check.circom`: proves `collateralUsd / debtUsd >= minCollateralRatioBps / 10000`.

## Prerequisites

- `circom` installed and available in your PATH.
- `snarkjs` installed (project dev dependency).

## Quick Start

1. Build the proving artifacts:

```bash
npm run zk:setup
```

2. Generate and verify a proof using sample input:

```bash
npm run zk:prove
```

3. Sync generated Solidity verifier into contracts:

```bash
npm run zk:sync-verifier
```

4. Build a custom input file:

```bash
npm run zk:build-input -- 125000 61000 12000 > circuits/inputs/health_check.custom.json
npm run zk:prove -- circuits/inputs/health_check.custom.json
```

5. Encode proof payload bytes for `PositionSafetyGateway.verifyPositionSafety`:

```bash
npm run zk:encode-payload -- circuits/artifacts/proof/proof.json circuits/artifacts/proof/public.json 0x<signalHash>
```

## Generated Outputs

- `circuits/artifacts/health_check.r1cs`
- `circuits/artifacts/health_check_js/`
- `circuits/artifacts/health_check_final.zkey`
- `circuits/artifacts/verification_key.json`
- `circuits/artifacts/verifier/HealthCheckGroth16Verifier.sol`
- `circuits/artifacts/proof/` (proof, public signals, calldata)
