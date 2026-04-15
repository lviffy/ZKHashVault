import ZKHashVaultJson from "../abi/ZKHashVault.json";
import VaultAssetTokenJson from "../abi/VaultAssetToken.json";
import CreditScorePassportJson from "../abi/CreditScorePassport.json";

// Deployed addresses on HashKey testnet
export const CONTRACT_ADDRESSES = {
  VaultAssetToken: "0x895a0Dc6639AF9dbcB8Bfe6a5De3e0ab172965f4" as const,
  ZKHashVault: "0xEC4A4d4c41C09814f7878A71c58D35637f9FecD6" as const,
  PositionSafetyGateway: "0x3A257b92ab97748B5392Ab6Dc6fa8A2f24E88Fd5" as const,
  CreditScorePassport: "0x41cE5735511D96a3F6e244f54e613327971026b2" as const,
};

export const ZKHashVaultAbi = ZKHashVaultJson.abi;
export const VaultAssetTokenAbi = VaultAssetTokenJson.abi;
export const CreditScorePassportAbi = CreditScorePassportJson.abi;
