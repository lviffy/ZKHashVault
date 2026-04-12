#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { AbiCoder } = require("ethers");

const [proofPathArg, publicPathArg, signalHashArg] = process.argv.slice(2);

const root = path.resolve(__dirname, "../..");
const proofPath = proofPathArg
  ? path.resolve(process.cwd(), proofPathArg)
  : path.join(root, "circuits/artifacts/proof/proof.json");
const publicPath = publicPathArg
  ? path.resolve(process.cwd(), publicPathArg)
  : path.join(root, "circuits/artifacts/proof/public.json");

if (!signalHashArg || !/^0x[0-9a-fA-F]{64}$/.test(signalHashArg)) {
  console.error("Usage: node scripts/zk/encode_payload.js [proof.json] [public.json] <signalHash>");
  process.exit(1);
}

const proofJson = JSON.parse(fs.readFileSync(proofPath, "utf8"));
const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf8"));

if (!Array.isArray(publicSignals) || publicSignals.length !== 1) {
  throw new Error("Expected exactly one public signal for health_check circuit");
}

const pA = [proofJson.pi_a[0], proofJson.pi_a[1]];
const pB = [
  [proofJson.pi_b[0][1], proofJson.pi_b[0][0]],
  [proofJson.pi_b[1][1], proofJson.pi_b[1][0]],
];
const pC = [proofJson.pi_c[0], proofJson.pi_c[1]];
const pubSignals = [publicSignals[0]];

const coder = AbiCoder.defaultAbiCoder();
const encoded = coder.encode(
  ["tuple(uint256[2] pA,uint256[2][2] pB,uint256[2] pC,uint256[1] pubSignals,bytes32 signalHash)"],
  [
    {
      pA,
      pB,
      pC,
      pubSignals,
      signalHash: signalHashArg,
    },
  ]
);

process.stdout.write(`${encoded}\n`);
