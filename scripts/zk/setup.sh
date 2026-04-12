#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CIRCUIT_NAME="health_check"

CIRCUIT_PATH="${ROOT_DIR}/circuits/${CIRCUIT_NAME}.circom"
ARTIFACT_DIR="${ROOT_DIR}/circuits/artifacts"
VERIFIER_DIR="${ARTIFACT_DIR}/verifier"

PTAU_FILE="${ROOT_DIR}/circuits/powersOfTau28_hez_final_12.ptau"
PTAU_URL="${PTAU_URL:-https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau}"

if ! command -v circom >/dev/null 2>&1; then
  echo "circom is required but was not found in PATH"
  exit 1
fi

if ! command -v snarkjs >/dev/null 2>&1; then
  echo "snarkjs is required but was not found in PATH"
  echo "Install with: npm install"
  exit 1
fi

mkdir -p "${ARTIFACT_DIR}" "${VERIFIER_DIR}"

if [[ ! -f "${PTAU_FILE}" ]]; then
  echo "Downloading Powers of Tau file to ${PTAU_FILE}"
  curl -L "${PTAU_URL}" -o "${PTAU_FILE}"
fi

echo "Compiling circuit..."
circom "${CIRCUIT_PATH}" --r1cs --wasm --sym -o "${ARTIFACT_DIR}"

echo "Running Groth16 setup..."
snarkjs groth16 setup \
  "${ARTIFACT_DIR}/${CIRCUIT_NAME}.r1cs" \
  "${PTAU_FILE}" \
  "${ARTIFACT_DIR}/${CIRCUIT_NAME}_0000.zkey"

CONTRIBUTION_ENTROPY="${ZKEY_ENTROPY:-adaptive-vault-health-check-$(date +%s)}"

echo "Contributing to zkey..."
printf '%s\n' "${CONTRIBUTION_ENTROPY}" | snarkjs zkey contribute \
  "${ARTIFACT_DIR}/${CIRCUIT_NAME}_0000.zkey" \
  "${ARTIFACT_DIR}/${CIRCUIT_NAME}_final.zkey"

echo "Exporting verification key and verifier contract..."
snarkjs zkey export verificationkey \
  "${ARTIFACT_DIR}/${CIRCUIT_NAME}_final.zkey" \
  "${ARTIFACT_DIR}/verification_key.json"

snarkjs zkey export solidityverifier \
  "${ARTIFACT_DIR}/${CIRCUIT_NAME}_final.zkey" \
  "${VERIFIER_DIR}/HealthCheckGroth16Verifier.sol"

echo "ZK setup complete"
