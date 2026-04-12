import AdaptiveVaultJson from "../abi/AdaptiveVault.json";
import VaultAssetTokenJson from "../abi/VaultAssetToken.json";
import CreditScorePassportJson from "../abi/CreditScorePassport.json";

// Default local addresses from hardhat fallback
export const CONTRACT_ADDRESSES = {
  VaultAssetToken: "0x258C11379702E29f67D583e1f962f4b492F83150" as const,
  AdaptiveVault: "0xb486Ea367F47D88067FB2f88525cca9c872052AE" as const,
  PositionSafetyGateway: "0xd56141A0e8A9c234156061806b0a0BC9b1031f57" as const,
  CreditScorePassport: "0x37E933a96BE995C440826D7A4A8698911f151aCc" as const,
};

export const AdaptiveVaultAbi = AdaptiveVaultJson.abi;
export const VaultAssetTokenAbi = VaultAssetTokenJson.abi;
export const CreditScorePassportAbi = CreditScorePassportJson.abi;


