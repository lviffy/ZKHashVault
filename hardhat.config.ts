import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";

const hashkeyRpcUrl = process.env.HASHKEY_RPC_URL;
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

const networks: HardhatUserConfig["networks"] = {
  hardhat: {},
  localhost: {
    url: "http://127.0.0.1:8545",
  },
};

if (hashkeyRpcUrl && deployerPrivateKey) {
  networks.hashkeyTestnet = {
    url: hashkeyRpcUrl,
    accounts: [deployerPrivateKey],
  };
}

const config: HardhatUserConfig = {
  networks,
  solidity: {
    version: "0.8.26",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache/hardhat",
    artifacts: "./artifacts/hardhat",
  },
};

export default config;
