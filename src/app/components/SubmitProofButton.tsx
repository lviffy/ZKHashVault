"use client";

import { useWriteContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect } from "react";
import PositionSafetyGatewayJson from "../abi/PositionSafetyGateway.json";
import { CONTRACT_ADDRESSES } from "../lib/contracts";

export function SubmitProofButton({
  signalHash,
  proofBytes,
  disabled
}: {
  signalHash: string;
  proofBytes: string;
  disabled?: boolean;
}) {
  const { writeContract, isPending: isWritePending, data: hash, error: writeError } = useWriteContract();
  const { isConnected } = useAccount();
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({ hash });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleVerify = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.PositionSafetyGateway,
      abi: PositionSafetyGatewayJson,
      functionName: "verifyPositionSafety",
      args: [signalHash, proofBytes],
    });
  };

  if (!mounted) {
    return <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse h-[52px]" />;
  }

  if (!isConnected) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-medium text-amber-700">
        Connect Wallet to Verify Risk Constraints
      </div>
    );
  }

  const isPending = isWritePending || isConfirming;
  const isError = writeError || txError;

  return (
    <div className="mt-4 flex flex-col gap-3">
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 mb-2">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-emerald-800">Safety Proof Verified On-Chain ✅</p>
          <a href={`https://testnet-explorer.hsk.xyz/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 underline mt-1">
            View Transaction
          </a>
        </div>
      ) : (
        <button
          onClick={handleVerify}
          disabled={disabled || isPending || !proofBytes}
          className="relative w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:bg-slate-300 disabled:text-slate-500 transition-colors overflow-hidden flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isWritePending ? "Awaiting Wallet..." : "Verifying ZK Proof On-Chain..."}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              Verify Safety Proof On-Chain
            </>
          )}
        </button>
      )}

      {isError && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
          <p className="font-semibold mb-1">Verification Failed</p>
          <p className="break-words font-mono text-[10px] opacity-80">
            {(writeError?.message || txError?.message || "Unknown error").slice(0, 100)}...
          </p>
        </div>
      )}
    </div>
  );
}
