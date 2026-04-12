import AdaptiveVaultJson from "../abi/AdaptiveVault.json";
import VaultAssetTokenJson from "../abi/VaultAssetToken.json";
import CreditScorePassportJson from "../abi/CreditScorePassport.json";

// Default local addresses from hardhat fallback
export const CONTRACT_ADDRESSES = {
  VaultAssetToken: "0x5a1Ac72142213da994938901c096089CA1130F85" as const,
  AdaptiveVault: "0x2bD4E4540232f4013a2D4445aD2A9F7997b302c0" as const,
  PositionSafetyGateway: "0xBAeb83d4bf598697f15d9f97d62b4379095f7Ec8" as const,
  CreditScorePassport: "0x7F9e4c28A88ab353281bA2f030C796767Faa1a43" as const,
};

export const AdaptiveVaultAbi = AdaptiveVaultJson.abi;
export const VaultAssetTokenAbi = VaultAssetTokenJson.abi;
export const CreditScorePassportAbi = CreditScorePassportJson.abi;


