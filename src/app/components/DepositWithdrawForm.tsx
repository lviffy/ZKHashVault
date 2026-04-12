"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, AdaptiveVaultAbi, VaultAssetTokenAbi } from "../lib/contracts";

export function DepositWithdrawForm() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  const amountWei = amount ? parseUnits(amount, 18) : 0n;

  // Reads
  const { data: userAssetBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.VaultAssetToken,
    abi: VaultAssetTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: userVaultBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.AdaptiveVault,
    abi: AdaptiveVaultAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance } = useReadContract({
    address: CONTRACT_ADDRESSES.VaultAssetToken,
    abi: VaultAssetTokenAbi,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESSES.AdaptiveVault] : undefined,
    query: { enabled: !!address },
  });

  // Writes
  const { writeContract: writeApprove, data: approveTxHash } = useWriteContract();
  const { writeContract: writeDeposit, data: depositTxHash } = useWriteContract();
  const { writeContract: writeWithdraw, data: withdrawTxHash } = useWriteContract();

  const isApproved = (allowance as bigint) >= amountWei;

  const handleAction = () => {
    if (!address) return;

    if (tab === "deposit") {
      if (!isApproved) {
        writeApprove({
          address: CONTRACT_ADDRESSES.VaultAssetToken,
          abi: VaultAssetTokenAbi,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.AdaptiveVault, amountWei],
        });
      } else {
        writeDeposit({
          address: CONTRACT_ADDRESSES.AdaptiveVault,
          abi: AdaptiveVaultAbi,
          functionName: "deposit",
          args: [amountWei, address],
        });
      }
    } else {
      writeWithdraw({
        address: CONTRACT_ADDRESSES.AdaptiveVault,
        abi: AdaptiveVaultAbi,
        functionName: "withdraw",
        args: [amountWei, address, address],
      });
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Vault Portal</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("deposit")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              tab === "deposit" ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              tab === "withdraw" ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Amount (USDC)</span>
          <span>Balance: {userAssetBalance ? formatUnits(userAssetBalance as bigint, 18) : "0.0"}</span>
        </div>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-2xl outline-none focus:border-emerald-500 disabled:opacity-50"
          disabled={!address}
        />
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <div className="flex justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded">
          <span>Your Vault Shares:</span>
          <span className="font-semibold text-slate-700">{userVaultBalance ? formatUnits(userVaultBalance as bigint, 18) : "0.0"} aUSDC</span>
        </div>
      </div>

      <button
        onClick={handleAction}
        disabled={!address || !amount || parseFloat(amount) <= 0}
        className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
      >
        {!address
          ? "Connect Wallet First"
          : tab === "deposit"
          ? !isApproved
            ? "Approve USDC"
            : "Deposit to Vault"
          : "Withdraw from Vault"}
      </button>
    </article>
  );
}
