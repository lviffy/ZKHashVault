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

  const vaultFactory = await hre.ethers.getContractFactory("AdaptiveVault");
  const vault = await vaultFactory.deploy(await token.getAddress(), policyUpdater, await gateway.getAddress());
  await vault.waitForDeployment();

  const passportFactory = await hre.ethers.getContractFactory("CreditScorePassport");
  const passport = await passportFactory.deploy(passportOwner);
  await passport.waitForDeployment();

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

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
    },
  };

  const deploymentDir = path.resolve(process.cwd(), "deployments");
  await mkdir(deploymentDir, { recursive: true });

  const outputPath = path.join(deploymentDir, `${chainId}.json`);
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("Deployment complete");
  console.log(JSON.stringify(manifest, null, 2));
  console.log(`Saved manifest to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
