import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import hre from "hardhat";

type DeploymentManifest = {
  chainId: number;
  network: string;
  deployedAt: string;
  deployer: string;
  configuration: {
    policyUpdater: string;
    proofSigner: string;
    passportOwner: string;
    initialMintWei: string;
  };
  contracts: {
    vaultAssetToken: string;
    adaptiveVault: string;
    healthCheckGroth16Verifier: string;
    groth16SafetyProofVerifier: string;
    safetyProofVerifierEcdsa: string;
    positionSafetyGateway: string;
    creditScorePassport: string;
    poolAAdapter: string;
    poolBAdapter: string;
  };
};

function getAddressEnvOrDefault(name: string, fallback: string): string {
  const raw = process.env[name]?.trim();
  return raw && raw.length > 0 ? raw : fallback;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const policyUpdater = getAddressEnvOrDefault("POLICY_UPDATER_ADDRESS", deployer.address);
  const proofSigner = getAddressEnvOrDefault("PROOF_SIGNER_ADDRESS", deployer.address);
  const passportOwner = getAddressEnvOrDefault("PASSPORT_OWNER_ADDRESS", deployer.address);
  const initialMintWei = process.env.INITIAL_MINT_WEI?.trim() || "0";

  const tokenFactory = await hre.ethers.getContractFactory("VaultAssetToken");
  const token = await tokenFactory.deploy(deployer.address);
  await token.waitForDeployment();

  if (BigInt(initialMintWei) > 0n) {
    const mintTx = await token.mint(deployer.address, initialMintWei);
    await mintTx.wait();
  }

  const ecdsaVerifierFactory = await hre.ethers.getContractFactory("SafetyProofVerifier");
  const ecdsaVerifier = await ecdsaVerifierFactory.deploy(proofSigner, deployer.address);
  await ecdsaVerifier.waitForDeployment();

  const healthCheckVerifierFactory = await hre.ethers.getContractFactory("Groth16Verifier");
  const healthCheckVerifier = await healthCheckVerifierFactory.deploy();
  await healthCheckVerifier.waitForDeployment();

  const groth16AdapterFactory = await hre.ethers.getContractFactory("Groth16SafetyProofVerifier");
  const groth16Adapter = await groth16AdapterFactory.deploy(await healthCheckVerifier.getAddress());
  await groth16Adapter.waitForDeployment();

  const gatewayFactory = await hre.ethers.getContractFactory("PositionSafetyGateway");
  const gateway = await gatewayFactory.deploy(await groth16Adapter.getAddress());
  await gateway.waitForDeployment();

  let priceFeedAddress = process.env.CHAINLINK_PRICE_FEED_ADDRESS?.trim();
  if (!priceFeedAddress) {
    // Hardcode Sepolia ETH/USD Chainlink Price Feed (since we don't use mocks anymore)
    priceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    console.log("No CHAINLINK_PRICE_FEED_ADDRESS provided, defaulting to real Sepolia ETH/USD Feed: ", priceFeedAddress);
  }

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  // -------------------------------------------------------------
  // LENDING POOLS
  // -------------------------------------------------------------
  console.log("Network assumes a valid Testnet / Mainnet fork. Deploying real Aave and Compound Adapters...");
  // Use Sepolia Testnet addresses:
  const tokenAddress = await token.getAddress();
  
  const AAVE_POOL_SEPOLIA = getAddressEnvOrDefault("AAVE_POOL", "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951"); 
  const AAVE_aUSDC_SEPOLIA = getAddressEnvOrDefault("AAVE_ATOKEN", "0x16dA4541aD1807f4443d92D26044C1147406EB80");
  const COMPOUND_V3_SEPOLIA = getAddressEnvOrDefault("COMPOUND_POOL", "0x3c27ab2805d76c1A64988bc2c7A1b3C5c756Bc0C");

  const aaveFactory = await hre.ethers.getContractFactory("AaveV3Adapter");
  let poolAContract = await aaveFactory.deploy(tokenAddress, AAVE_aUSDC_SEPOLIA, AAVE_POOL_SEPOLIA);
  await poolAContract.waitForDeployment();
  let poolAAddress = await poolAContract.getAddress();

  const compoundFactory = await hre.ethers.getContractFactory("CompoundV3Adapter");
  let poolBContract = await compoundFactory.deploy(tokenAddress, COMPOUND_V3_SEPOLIA);
  await poolBContract.waitForDeployment();
  let poolBAddress = await poolBContract.getAddress();

  // -------------------------------------------------------------
  // VAULT DEPLOYMENT
  // -------------------------------------------------------------
  const vaultFactory = await hre.ethers.getContractFactory("AdaptiveVault");
  const vault = await vaultFactory.deploy(
    await token.getAddress(),
    policyUpdater,
    await gateway.getAddress(),
    priceFeedAddress,
    poolAAddress,
    poolBAddress
  );
  await vault.waitForDeployment();

  await poolAContract.setVault(await vault.getAddress());
  await poolBContract.setVault(await vault.getAddress());
  console.log("Bound real adapters to the vault.");

  const passportFactory = await hre.ethers.getContractFactory("CreditScorePassport");
  const passport = await passportFactory.deploy(passportOwner);
  await passport.waitForDeployment();

  const manifest: DeploymentManifest = {
    chainId,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    configuration: {
      policyUpdater,
      proofSigner,
      passportOwner,
      initialMintWei,
    },
    contracts: {
      vaultAssetToken: await token.getAddress(),
      adaptiveVault: await vault.getAddress(),
      healthCheckGroth16Verifier: await healthCheckVerifier.getAddress(),
      groth16SafetyProofVerifier: await groth16Adapter.getAddress(),
      safetyProofVerifierEcdsa: await ecdsaVerifier.getAddress(),
      positionSafetyGateway: await gateway.getAddress(),
      creditScorePassport: await passport.getAddress(),
      poolAAdapter: poolAAddress,
      poolBAdapter: poolBAddress,
    },
  };

  const deploymentDir = path.resolve(process.cwd(), "deployments");
  await mkdir(deploymentDir, { recursive: true });

  const outputPath = path.join(deploymentDir, `${chainId}.json`);
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("Deployment complete");
  console.log(`Saved manifest to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
