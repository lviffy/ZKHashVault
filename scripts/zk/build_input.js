#!/usr/bin/env node

const [collateralUsd, debtUsd, minCollateralRatioBps = "12000"] = process.argv.slice(2);

if (!collateralUsd || !debtUsd) {
  console.error("Usage: node scripts/zk/build_input.js <collateralUsd> <debtUsd> [minCollateralRatioBps]");
  process.exit(1);
}

const input = {
  collateralUsd: String(collateralUsd),
  debtUsd: String(debtUsd),
  minCollateralRatioBps: String(minCollateralRatioBps),
};

process.stdout.write(`${JSON.stringify(input, null, 2)}\n`);
