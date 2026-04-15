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
    zkHashVault: string;
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
    console.log("No CHAINLINK_PRICE_FEED_ADDRESS in .env. Deploying native HashKeyPriceOracle...");
    const oracleFactory = await hre.ethers.getContractFactory("HashKeyPriceOracle");
    const oracle = await oracleFactory.deploy(2000); // Deploy with $2000 ETH base
    await oracle.waitForDeployment();
    priceFeedAddress = await oracle.getAddress();
  }

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  // -------------------------------------------------------------
  // LENDING POOLS
  // -------------------------------------------------------------
  console.log(`Network targets HashKey testnet (chainId: ${chainId}). Deploying Native Yield Endpoints...`);
  const tokenAddress = await token.getAddress();
  
  // 1. Deploy two separate HashKey Yield Protocols
  const protocolFactory = await hre.ethers.getContractFactory("HashKeyLendingProtocol");
  
  const protocolA = await protocolFactory.deploy(tokenAddress);
  await protocolA.waitForDeployment();
  const protocolAAddr = await protocolA.getAddress();
  
  const protocolB = await protocolFactory.deploy(tokenAddress);
  await protocolB.waitForDeployment();
  const protocolBAddr = await protocolB.getAddress();

  // 2. Deploy Adapters to bridge Vault -> Protocols
  const adapterFactory = await hre.ethers.getContractFactory("HashKeyLendingAdapter");
  
  const adapterA = await adapterFactory.deploy(tokenAddress, protocolAAddr);
  await adapterA.waitForDeployment();
  const adapterAAddr = await adapterA.getAddress();

  const adapterB = await adapterFactory.deploy(tokenAddress, protocolBAddr);
  await adapterB.waitForDeployment();
  const adapterBAddr = await adapterB.getAddress();

  // -------------------------------------------------------------
  // VAULT DEPLOYMENT
  // -------------------------------------------------------------
  const vaultFactory = await hre.ethers.getContractFactory("ZKHashVault");
  const vault = await vaultFactory.deploy(
    tokenAddress,
    policyUpdater,
    await gateway.getAddress(),
    priceFeedAddress,
    adapterAAddr,
    adapterBAddr
  );
  await vault.waitForDeployment();

  // Wire Adapters securely to Vault
  await adapterA.setVault(await vault.getAddress());
  await adapterB.setVault(await vault.getAddress());
  console.log("Bound native yield adapters to the vault.");

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
      zkHashVault: await vault.getAddress(),
      healthCheckGroth16Verifier: await healthCheckVerifier.getAddress(),
      groth16SafetyProofVerifier: await groth16Adapter.getAddress(),
      safetyProofVerifierEcdsa: await ecdsaVerifier.getAddress(),
      positionSafetyGateway: await gateway.getAddress(),
      creditScorePassport: await passport.getAddress(),
      poolAAdapter: adapterAAddr,
      poolBAdapter: adapterBAddr,
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
