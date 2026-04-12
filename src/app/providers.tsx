"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type State, WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, localhost } from "wagmi/chains";
import { defineChain } from "viem";

const queryClient = new QueryClient();

export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HSK',
    symbol: 'HSK',
  },
  rpcUrls: {
    default: { http: ['https://hashkey-chain-testnet.rpc.thirdweb.com'] },
    public: { http: ['https://hashkey-chain-testnet.rpc.thirdweb.com'] },
  },
  blockExplorers: {
    default: { name: 'HashKey Testnet Explorer', url: 'https://testnet-explorer.hsk.xyz' },
  },
})

export const config = createConfig({
  chains: [hashkeyTestnet, localhost, hardhat],
  transports: {
    [hashkeyTestnet.id]: http(),
    [localhost.id]: http(),
    [hardhat.id]: http(),
  },
});

export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}