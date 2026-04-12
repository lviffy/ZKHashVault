"use client";

import { useWriteContract, useAccount } from "wagmi";
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
  const { writeContract, isPending, data } = useWriteContract();
  const { isConnected } = useAccount();

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

  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        onClick={handleVerify}
        disabled={disabled || isPending || !proofBytes}
        className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
      >
        {isPending ? "Submitting TX..." : "Verify Safety Proof On-Chain"}
      </button>
      {data && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 break-all border border-emerald-200 text-center">
          Tx Submitted: {data}
        </div>
      )}
    </div>
  );
}
