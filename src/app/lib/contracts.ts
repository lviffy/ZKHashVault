import AdaptiveVaultJson from "../abi/AdaptiveVault.json";
import VaultAssetTokenJson from "../abi/VaultAssetToken.json";

// Default local addresses from hardhat fallback
export const CONTRACT_ADDRESSES = {
  VaultAssetToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const,
  AdaptiveVault: "0x2bD4E4540232f4013a2D4445aD2A9F7997b302c0" as const,
  PositionSafetyGateway: "0xBAeb83d4bf598697f15d9f97d62b4379095f7Ec8" as const,
};

export const AdaptiveVaultAbi = AdaptiveVaultJson.abi;
export const VaultAssetTokenAbi = VaultAssetTokenJson.abi;


