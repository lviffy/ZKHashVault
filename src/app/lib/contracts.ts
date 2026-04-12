import AdaptiveVaultJson from "../abi/AdaptiveVault.json";
import VaultAssetTokenJson from "../abi/VaultAssetToken.json";
import CreditScorePassportJson from "../abi/CreditScorePassport.json";

// Default local addresses from hardhat fallback
export const CONTRACT_ADDRESSES = {
  VaultAssetToken: "0x13dbca9bfbf84f2C224989bB4acF279Bfab779b3" as const,
  AdaptiveVault: "0xe738c3464AA0a2A6D7bedC0918a90eed3601a289" as const,
  PositionSafetyGateway: "0x1998810A374B095f169F79148741d994545F9470" as const,
  CreditScorePassport: "0xbC5056D3a5c3505A67fBF6795Da6b52A6e4Ca277" as const,
};

export const AdaptiveVaultAbi = AdaptiveVaultJson.abi;
export const VaultAssetTokenAbi = VaultAssetTokenJson.abi;
export const CreditScorePassportAbi = CreditScorePassportJson.abi;


