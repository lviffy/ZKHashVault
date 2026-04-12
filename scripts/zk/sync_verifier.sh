#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOURCE_PATH="${ROOT_DIR}/circuits/artifacts/verifier/HealthCheckGroth16Verifier.sol"
TARGET_PATH="${ROOT_DIR}/contracts/HealthCheckGroth16Verifier.sol"

if [[ ! -f "${SOURCE_PATH}" ]]; then
  echo "Generated verifier not found. Run: npm run zk:setup"
  exit 1
fi

cp "${SOURCE_PATH}" "${TARGET_PATH}"
echo "Synced ${SOURCE_PATH} -> ${TARGET_PATH}"
