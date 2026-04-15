"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useEffect, useState } from "react";

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (!mounted) {
    return (
      <div className="h-8 w-24 bg-white/10 animate-pulse rounded-full" />
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur">
        <span className="text-xs font-mono font-medium text-slate-100">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="rounded-full border border-cyan-200/35 bg-cyan-300/20 px-4 py-2 text-xs font-semibold text-cyan-50 hover:bg-cyan-300/30 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
