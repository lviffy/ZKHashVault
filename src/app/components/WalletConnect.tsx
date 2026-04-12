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
      <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-full" />
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
        <span className="text-xs font-mono font-medium text-slate-700">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
