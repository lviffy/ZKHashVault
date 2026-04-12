"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type State, WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, localhost } from "wagmi/chains";

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [localhost, hardhat],
  transports: {
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