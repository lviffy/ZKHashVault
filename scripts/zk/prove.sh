#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CIRCUIT_NAME="health_check"

INPUT_PATH="${1:-${ROOT_DIR}/circuits/inputs/health_check.sample.json}"

ARTIFACT_DIR="${ROOT_DIR}/circuits/artifacts"
PROOF_DIR="${ARTIFACT_DIR}/proof"

WASM_PATH="${ARTIFACT_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm"
WITNESS_GEN_PATH="${ARTIFACT_DIR}/${CIRCUIT_NAME}_js/generate_witness.js"
ZKEY_PATH="${ARTIFACT_DIR}/${CIRCUIT_NAME}_final.zkey"
VKEY_PATH="${ARTIFACT_DIR}/verification_key.json"

if [[ ! -f "${WASM_PATH}" || ! -f "${ZKEY_PATH}" || ! -f "${VKEY_PATH}" ]]; then
  echo "Missing circuit artifacts. Run: npm run zk:setup"
  exit 1
fi

if [[ ! -f "${INPUT_PATH}" ]]; then
  echo "Input file not found: ${INPUT_PATH}"
  exit 1
fi

mkdir -p "${PROOF_DIR}"

echo "Generating witness..."
node "${WITNESS_GEN_PATH}" \
  "${WASM_PATH}" \
  "${INPUT_PATH}" \
  "${PROOF_DIR}/witness.wtns"

echo "Generating proof..."
snarkjs groth16 prove \
  "${ZKEY_PATH}" \
  "${PROOF_DIR}/witness.wtns" \
  "${PROOF_DIR}/proof.json" \
  "${PROOF_DIR}/public.json"

echo "Verifying proof..."
snarkjs groth16 verify \
  "${VKEY_PATH}" \
  "${PROOF_DIR}/public.json" \
  "${PROOF_DIR}/proof.json"

echo "Exporting Solidity calldata..."
snarkjs zkey export soliditycalldata \
  "${PROOF_DIR}/public.json" \
  "${PROOF_DIR}/proof.json" \
  > "${PROOF_DIR}/solidity-calldata.txt"

echo "Proof generation complete"
echo "Proof: ${PROOF_DIR}/proof.json"
echo "Public signals: ${PROOF_DIR}/public.json"
echo "Solidity calldata: ${PROOF_DIR}/solidity-calldata.txt"
