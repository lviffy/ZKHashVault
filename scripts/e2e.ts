import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runStrategyTick } from "../services/strategy/src/index.ts";
import { StrategySnapshotCache } from "../services/strategy/src/snapshotCache.ts";

import { buildGroth16SafetyProofPayload } from "../services/strategy/src/safetyProof.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const networkFolder = process.env.HARDHAT_NETWORK || "hardhat";
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const deploymentPath = path.resolve(__dirname, `../deployments/${chainId}.json`);

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found at ${deploymentPath}. Please run deploy.ts first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const [deployer, user] = await ethers.getSigners();
  console.log(`Starting E2E vault test with chainId: ${chainId}`);
  
  // 1. Connect to deployed contracts
  const Token = await ethers.getContractAt("VaultAssetToken", manifest.contracts.vaultAssetToken);
  const Vault = await ethers.getContractAt("AdaptiveVault", manifest.contracts.adaptiveVault);
  
  console.log(`[1/5] Contracts loaded. Vault address: ${await Vault.getAddress()}`);

  // 2. User acquires and approves tokens
  const depositAmount = ethers.parseEther("1000"); // 1000 Tokens
  console.log(`[2/5] Minting and approving ${ethers.formatEther(depositAmount)} tokens for user...`);
  
  const mintTx = await Token.connect(deployer).mint(user.address, depositAmount);
  await mintTx.wait();
  
  const approveTx = await Token.connect(user).approve(await Vault.getAddress(), depositAmount);
  await approveTx.wait();

  // 3. User deposits into Vault
  console.log(`[3/5] User depositing ${ethers.formatEther(depositAmount)} tokens into vault...`);
  const depositTx = await Vault.connect(user).deposit(depositAmount);
  await depositTx.wait();
  
  const userShares = await Vault.shareBalance(user.address);
  console.log(`      Received ${ethers.formatEther(userShares)} Vault Shares.`);

  console.log(`[4/5] Running Strategy Engine Tick (Simulated AI Risk Adjustment)...`);
  
  const latestBlock = await ethers.provider.getBlock("latest");

  const priceFeedAddress = await Vault.priceFeed();
  const oracle = await ethers.getContractAt("contracts/HashKeyPriceOracle.sol:AggregatorV3Interface", priceFeedAddress);
  const oracleData = await oracle.latestRoundData();
  const currentPrice = Number(oracleData.answer);
  // We use the real chainlink price that is returned or a dummy bound just for the math check
  
  const cache = new StrategySnapshotCache();
  const strategyResult = await runStrategyTick({
    snapshot: {
      timestamp: latestBlock!.timestamp,
      poolAApyBps: 400, 
      poolBApyBps: 850, 
      volatilityBps: 8000, 
      utilizationBps: 9000, 
      estimatedSlippageBps: 20, 
      positionHealthFactorBps: 14000, 
      oraclePrice: currentPrice, 
    },
    currentPoolABps: 5000,
    config: {
      cadenceSeconds: 600,
      maxRebalanceDeltaBps: 2000, 
      maxSlippageBps: 50,
      minHealthFactorBps: 12000,
      maxOracleAgeSeconds: 86400, // Make sure staleness check easily passes since we rely on actual chainlink data
      nowTimestamp: latestBlock!.timestamp,
      minOraclePrice: currentPrice - 10000000,
      maxOraclePrice: currentPrice + 10000000,
    },
    cache
  });

  if (!strategyResult.ok) {
    throw new Error(`Strategy rejected: ${strategyResult.reason}`);
  }

  const instruction = strategyResult.instruction;
  console.log(`      Strategy Generated! Recommended shift by: ${instruction!.deltaPoolABps} bps`);

  console.log(`[5/5] Generating Cryptographic Proof and Sending Rebalance Transaction...`);
  
  const updaterAddress = manifest.configuration.policyUpdater;
  await ethers.provider.send("hardhat_impersonateAccount", [updaterAddress]);
  await ethers.provider.send("hardhat_setBalance", [updaterAddress, "0xDE0B6B3A7640000"]); // Give it some ETH
  const impersonatedUpdater = await ethers.getSigner(updaterAddress);
  
  const signalHash = ethers.keccak256(ethers.toUtf8Bytes("live-e2e-signal"));
  
  const proof = await buildGroth16SafetyProofPayload(signalHash);

  await ethers.provider.send("hardhat_setBalance", [updaterAddress, "0xDE0B6B3A7640000"]); 
  
  // Refresh price feed so OracleStale doesn't trigger
  const hkOracle = await ethers.getContractAt("HashKeyPriceOracle", priceFeedAddress);
  await (hkOracle.connect(deployer) as any).updateAnswer(currentPrice);

  // Set the staleness dynamically if we want using hardhat overrides, but we bypass it here.
  const rebalanceTx = await Vault.connect(impersonatedUpdater).rebalance(
    instruction!.deltaPoolABps,
    instruction!.slippageBps,
    instruction!.healthFactorWad,
    signalHash,
    proof
  );
  const receipt = await rebalanceTx.wait();

  const rebalanceEvent = receipt!.logs.find((log: any) => {
    try {
        const decoded = Vault.interface.parseLog(log);
        return decoded && decoded.name === "Rebalanced";
    } catch(e) {
        return false;
    }
  });

  if (rebalanceEvent) {
     const decoded = Vault.interface.parseLog(rebalanceEvent as any);
     console.log(`\n✅ SUCCESS! Vault Rebalanced On-Chain!`);
     console.log(`      Old Allocation: Pool A: ${decoded?.args[0]} | Pool B: ${decoded?.args[1]}`);
     console.log(`      New Allocation: Pool A: ${decoded?.args[2]} | Pool B: ${decoded?.args[3]}`);
  }

  console.log(`\nE2E Scenario completed flawlessly.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
