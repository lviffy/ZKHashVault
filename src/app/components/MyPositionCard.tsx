"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, ZKHashVaultAbi, VaultAssetTokenAbi, CreditScorePassportAbi } from "../lib/contracts";

export function MyPositionCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  const amountWei = amount ? parseUnits(amount, 18) : 0n;

  // Writes
  const { writeContract: writeApprove, isPending: isApproving, data: approveTx } = useWriteContract();
  const { writeContract: writeDeposit, isPending: isDepositing, data: depositTx } = useWriteContract();
  const { writeContract: writeWithdraw, isPending: isWithdrawing, data: withdrawTx } = useWriteContract();

  // Watch for transaction completion to refetch read data
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositTx });
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawTx });
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveTx });

  // Add refetch functions
  const { data: userAssetBalance, refetch: refetchAssetBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.VaultAssetToken,
    abi: VaultAssetTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: userVaultBalance, refetch: refetchVaultBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.ZKHashVault,
    abi: ZKHashVaultAbi,
    functionName: "shareBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.VaultAssetToken,
    abi: VaultAssetTokenAbi,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESSES.ZKHashVault] : undefined,
    query: { enabled: !!address },
  });

  // Automatically refetch when the transaction completes
  useEffect(() => {
    if (isDepositSuccess || isWithdrawSuccess || isApproveSuccess) {
      refetchAssetBalance();
      refetchVaultBalance();
      refetchAllowance();
      
      // Only clear the input field if it was an actual deposit/withdraw, NOT just an approval step
      if (isDepositSuccess || isWithdrawSuccess) {
        setAmount(""); 
      }
    }
  }, [isDepositSuccess, isWithdrawSuccess, isApproveSuccess, refetchAssetBalance, refetchVaultBalance, refetchAllowance]);

  const { data: tokenId } = useReadContract({
    address: CONTRACT_ADDRESSES.CreditScorePassport,
    abi: CreditScorePassportAbi,
    functionName: "tokenOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: scoreRecord } = useReadContract({
    address: CONTRACT_ADDRESSES.CreditScorePassport,
    abi: CreditScorePassportAbi,
    functionName: "scoreOf",
    args: tokenId ? [tokenId as bigint] : undefined,
    query: { enabled: !!tokenId },
  });

  const isApproved = (allowance as bigint) >= amountWei;
  
  // Format balances
  const displayVaultBalance = userVaultBalance ? Number(formatUnits(userVaultBalance as bigint, 18)).toFixed(2) : "0.00";
  const displayAssetBalance = userAssetBalance ? Number(formatUnits(userAssetBalance as bigint, 18)).toFixed(2) : "0.00";
  
  // Extract credit score
  // @ts-ignore
  const rawScore = scoreRecord && scoreRecord[2] ? Number(scoreRecord[0]) : 760; // fallback default if none minted

  const handleAction = () => {
    if (!address) return;

    if (tab === "deposit") {
      if (!isApproved) {
        writeApprove({
          address: CONTRACT_ADDRESSES.VaultAssetToken,
          abi: VaultAssetTokenAbi,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.ZKHashVault, amountWei],
        });
      } else {
        writeDeposit({
          address: CONTRACT_ADDRESSES.ZKHashVault,
          abi: ZKHashVaultAbi,
          functionName: "deposit",
          args: [amountWei],
        });
      }
    } else {
      writeWithdraw({
        address: CONTRACT_ADDRESSES.ZKHashVault,
        abi: ZKHashVaultAbi,
        functionName: "withdraw",
        args: [amountWei],
      });
    }
  };

  const isTxPending = isApproving || isDepositing || isWithdrawing || isDepositConfirming || isWithdrawConfirming || isApproveConfirming;

  if (!mounted) {
    return <article className="rounded-3xl border border-white/15 bg-white/[0.05] p-8 shadow-sm animate-pulse h-[400px]"></article>;
  }

  return (
    <article className="rounded-3xl border border-white/15 bg-slate-950/60 shadow-sm overflow-hidden flex flex-col h-full backdrop-blur-xl">
      <div className="bg-slate-950/90 px-8 py-6 text-white relative overflow-hidden border-b border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 -translate-x-10 translate-y-10"></div>
        
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300 relative z-10">My Position</h2>
        <div className="mt-4 flex items-end gap-3 relative z-10">
          <p className="text-4xl font-semibold tracking-tight">{displayVaultBalance}</p>
          <p className="text-lg text-slate-300 mb-1">avUSD</p>
        </div>
        <div className="mt-6 flex gap-6 relative z-10">
          <div>
            <p className="text-xs text-slate-300 uppercase tracking-widest">Earnings</p>
            <p className="text-emerald-300 font-medium mt-1">+$0.00</p>
          </div>
          <div>
            <p className="text-xs text-slate-300 uppercase tracking-widest">Credit Score</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white font-medium">{rawScore}</span>
              <span className="text-xs text-slate-300">({rawScore > 800 ? "Excellent" : rawScore > 600 ? "Good" : "Fair"})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 flex flex-col flex-1 bg-slate-950/40">
        <div className="flex rounded-lg bg-slate-900 p-1 mb-6 border border-white/10">
          <button
            onClick={() => setTab("deposit")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              tab === "deposit" ? "bg-white/15 text-white shadow-sm" : "text-slate-300 hover:text-white"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              tab === "withdraw" ? "bg-white/15 text-white shadow-sm" : "text-slate-300 hover:text-white"
            }`}
          >
            Withdraw
          </button>
        </div>

        <div className="flex justify-between text-xs text-slate-300/80 mb-2 font-medium">
          <span>Amount ({tab === "deposit" ? "USDC" : "avUSD"})</span>
          <span>Balance: {tab === "deposit" ? displayAssetBalance : displayVaultBalance}</span>
        </div>
        
        <div className="relative mb-6">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-slate-900/70 pl-4 pr-16 py-4 text-2xl font-semibold text-white outline-none focus:border-teal-300 disabled:opacity-50 transition-colors"
            disabled={!address || isTxPending}
          />
          <button 
            onClick={() => setAmount(tab === "deposit" ? displayAssetBalance : displayVaultBalance)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-200 hover:text-teal-100 uppercase tracking-wider"
          >
            Max
          </button>
        </div>

        <div className="mt-auto pt-4">
          <button
            onClick={handleAction}
            disabled={!mounted || !address || !amount || parseFloat(amount) <= 0 || isTxPending}
            className="w-full rounded-xl bg-gradient-to-r from-teal-300 to-cyan-300 py-4 text-sm font-semibold text-slate-900 shadow-md shadow-cyan-300/20 hover:opacity-95 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none transition-all"
          >
            {isTxPending ? "Confirming..." : (!mounted || !address)
              ? "Connect Wallet First"
              : tab === "deposit"
              ? !isApproved
                ? "Approve USDC Token"
                : "Deposit to Vault"
              : "Withdraw from Vault"}
          </button>
        </div>
      </div>
    </article>
  );
}
