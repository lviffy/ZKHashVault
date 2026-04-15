"use client";

import { useBlockNumber } from "wagmi";
import { useEffect, useState } from "react";
import { CONTRACT_ADDRESSES, ZKHashVaultAbi } from "../lib/contracts";
import { parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";

type RebalanceEvent = {
  txHash: string;
  blockNumber: number;
  newPoolABps: number;
  newPoolBBps: number;
  healthFactor: string;
};

export function RebalanceHistory() {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<RebalanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      if (!publicClient) return;
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESSES.ZKHashVault,
          event: parseAbiItem("event Rebalanced(uint16 previousPoolABps, uint16 previousPoolBBps, uint16 newPoolABps, uint16 newPoolBBps, uint64 oraclePrice, uint16 slippageBps, uint256 healthFactorWad, uint64 oracleTimestamp)"),
          fromBlock: fromBlock,
          toBlock: "latest"
        });

        const formatted = logs.map(l => ({
          txHash: l.transactionHash,
          blockNumber: Number(l.blockNumber),
          newPoolABps: l.args.newPoolABps as number,
          newPoolBBps: l.args.newPoolBBps as number,
          healthFactor: (Number(l.args.healthFactorWad || 0n) / 1e18).toFixed(2),
        })).reverse(); // Newest first
        
        setEvents(formatted);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [publicClient]);

  if (loading) {
    return <div className="animate-pulse h-32 bg-white/10 rounded-xl" />;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-300/80 border border-dashed border-white/20 rounded-xl">
        No recent rebalance operations found on-chain.
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {events.map((ev) => (
        <a 
          key={ev.txHash}
          href={`https://testnet-explorer.hsk.xyz/tx/${ev.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-3 rounded-xl border border-white/10 hover:border-cyan-200/35 transition-all bg-white/[0.04]"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white/10 text-slate-200 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">
                Aave {(ev.newPoolABps / 100).toFixed(0)}% / Compound {(ev.newPoolBBps / 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-300/70 font-mono">
                Block {ev.blockNumber} • HF: {ev.healthFactor}x
              </p>
            </div>
          </div>
          <div className="text-emerald-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  );
}
