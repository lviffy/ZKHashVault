# HashKey Testnet Deployment Guide

This guide will walk you through setting up your wallet, funding it with testnet tokens, and configuring your `.env` file to deploy your Smart Contracts to the HashKey Testnet.

## 1. Add HashKey Testnet to Your Wallet (MetaMask)

To interact with the HashKey Testnet, you need to add its custom RPC details to your Web3 wallet (like MetaMask).

1. Open your MetaMask extension.
2. Click the network dropdown at the top-left and select **Add network**.
3. Choose **Add a network manually** at the bottom.
4. Enter the following details:
   - **Network Name:** HashKey Chain Testnet
   - **New RPC URL:** `https://hashkeychain-testnet.alt.technology`
   - **Chain ID:** `133`
   - **Currency Symbol:** `HSK`
   - **Block Explorer URL:** `https://hashkeychain-testnet-explorer.alt.technology`
5. Click **Save** and switch to the new network.

> *Note: If these details change, refer to the official HashKey Chain documentation.*

## 2. Get Testnet Tokens (Faucet)

You need testnet HSK tokens to pay for transaction gas fees when deploying contracts and interacting with the network.

1. Visit the expected HashKey Chain Testnet Faucet (check official HashKey Discord or docs for the live faucet URL if it has moved).
2. Enter your wallet public address.
3. Request testnet tokens.
4. Wait a few moments, and you should see the `HSK` balance appear in your wallet.

## 3. Export Your Private Key

Your backend and deployment scripts need your private key to sign transactions automatically.

**WARNING: NEVER share your private key or commit it to GitHub. Do not use a wallet holding real mainnet funds for development.**

1. In MetaMask, click the three dots (`⋮`) next to your account name.
2. Select **Account Details** > **Show Private Key**.
3. Enter your MetaMask password and copy the Private Key string.

## 4. Configure the `.env` File

Now, map the gathered information to your `.env` file located in the root of the project:

```env
# Your HashKey testnet RPC URL
HASHKEY_RPC_URL=https://hashkeychain-testnet.alt.technology

# The private key of the account you funded with the Faucet
DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyFromMetaMask
STRATEGY_EXECUTOR_PRIVATE_KEY=0xYourPrivateKeyFromMetaMask
SAFETY_PROVER_PRIVATE_KEY=0xYourPrivateKeyFromMetaMask
```

*(For a simple test deployment, you can use the same private key for all three roles, though in production they should be split).*

## 5. Deploy

Once your `.env` file is saved and your account is funded, you can execute the deployment task:

```bash
npm run contracts:deploy:hashkey
```