import Link from "next/link";
import { runPhase3CreditAndZkStep } from "../../../services/strategy/src/phase3";
import { StrategySnapshotCache } from "../../../services/strategy/src/snapshotCache";
import { runStrategyTick } from "../../../services/strategy/src";
import { askAIForStrategy } from "../../../services/strategy/src/ai";
import { WalletConnect } from "../components/WalletConnect";
import { MyPositionCard } from "../components/MyPositionCard";
import { SubmitProofButton } from "../components/SubmitProofButton";

const DEMO_SNAPSHOT_TIMESTAMP = 1_776_000_000;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardHome() {
  const snapshotTimestamp = Math.floor(Date.now() / 1000) - 15;
  const cache = new StrategySnapshotCache();

  // Poll Gemini API instead of deterministic algorithm
  const geminiSuggestion = await askAIForStrategy([
    { asset: "Aave USDC Pool", currentAllocationBps: 5000 },
    { asset: "Compound avUSD Pool", currentAllocationBps: 5000 }
  ], "medium");

  const strategyResult = await runStrategyTick({
    snapshot: {
      timestamp: snapshotTimestamp,
      poolAApyBps: 1140,
      poolBApyBps: 980,
      volatilityBps: 4200,
      utilizationBps: 6100,
      estimatedSlippageBps: 35,
      positionHealthFactorBps: 13200,
      oraclePrice: 2100,
    },
    currentPoolABps: 5000,
    config: {
      cadenceSeconds: 600,
      maxRebalanceDeltaBps: 450,
      maxSlippageBps: 50,
      minHealthFactorBps: 12000,
      maxOracleAgeSeconds: 60,
      nowTimestamp: snapshotTimestamp,
      minOraclePrice: 1200,
      maxOraclePrice: 3500,
    },
    cache,
    executor: undefined // Don't trigger transaction on local gemini load yet
  });

  const phase3 = await runPhase3CreditAndZkStep({
    walletSnapshot: {
      repaymentRatioBps: 9200,
      liquidationCount: 1,
      positionHealthBps: 8500,
      activityScoreBps: 7600,
    },
    safetyInput: {
      collateralUsd: "125000",
      debtUsd: "61000",
      liquidationThresholdBps: 7800,
    },
    useEcdsaFallback: process.env.USE_ECDSA_PROOF_FALLBACK === "true",
    proverPrivateKey: process.env.SAFETY_PROVER_PRIVATE_KEY,
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#d4f7e6,transparent_36%),radial-gradient(circle_at_80%_0%,#dbeafe,transparent_32%),#f7faf7] px-6 py-6 text-slate-900 sm:px-10">
      <nav className="mx-auto mb-8 flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-emerald-700 hover:opacity-80 transition-opacity">
          <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="hidden sm:inline">AdaptiveVault</span>
        </Link>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> Live Engine</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200">Network: Hashkey Testnet</span>
          <WalletConnect />
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="rounded-3xl border border-emerald-200 bg-white/80 p-8 shadow-[0_20px_60px_-25px_rgba(16,185,129,0.35)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">AdaptiveVault Console</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Strategy Overview</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            Real-time execution details, credit scoring, and zero-knowledge proofs.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-3 items-start">
          <div className="lg:col-span-1">
            <MyPositionCard />
          </div>
          
          <div className="lg:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Expected APY</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {strategyResult.ok && strategyResult.policy ? (strategyResult.policy.expectedNetApyBps / 100).toFixed(2) : "0.00"}%
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk Class</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {strategyResult.ok && strategyResult.policy ? strategyResult.policy.riskClass.toUpperCase() : "N/A"}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-emerald-50 p-6 shadow-sm sm:col-span-2 flex flex-col justify-between overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-200 opacity-50 blur-2xl"></div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-800 font-semibold">Active Strategy Insight</p>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900 z-10 max-w-lg">
                Your vault is currently operating within a <strong>{strategyResult.ok && strategyResult.policy ? strategyResult.policy.riskClass.toUpperCase() : "N/A"}</strong> risk parameter. 
                Capital automatically flows to secure yielding assets while maintaining strict health factor thresholds protecting your position.
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Gemini AI Target Allocation</h2>
              <p className="mt-2 text-sm text-slate-600">
                The AI engine has analyzed market conditions and recommends the following portfolio breakdown.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-emerald-700">Aave USDC Pool</span>
                <span className="text-emerald-700">
                  {geminiSuggestion?.allocations?.["Aave USDC Pool"] ? (geminiSuggestion.allocations["Aave USDC Pool"] / 100).toFixed(1) : "50.0"}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${geminiSuggestion?.allocations?.["Aave USDC Pool"] ? (geminiSuggestion.allocations["Aave USDC Pool"] / 100) : 50}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm font-medium mt-2">
                <span className="text-blue-700">Compound avUSD Pool</span>
                <span className="text-blue-700">
                  {geminiSuggestion?.allocations?.["Compound avUSD Pool"] ? (geminiSuggestion.allocations["Compound avUSD Pool"] / 100).toFixed(1) : "50.0"}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${geminiSuggestion?.allocations?.["Compound avUSD Pool"] ? (geminiSuggestion.allocations["Compound avUSD Pool"] / 100) : 50}%` }}
                />
              </div>
            </div>

            {geminiSuggestion?.reasoning && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">AI REASONING</p>
                <p className="text-sm text-slate-700 italic">"{geminiSuggestion.reasoning}"</p>
              </div>
            )}
          </article>
          
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Cryptographic Security</h2>
              <p className="mt-2 text-sm text-slate-600">
                Your position is secured by zero-knowledge proofs. The system natively rejects any AI instruction that violates health factor and slippage thresholds on-chain.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center py-6 rounded-xl border border-emerald-100 bg-emerald-50/50">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-emerald-800 font-semibold text-lg">Protected by ZK-Snarks</p>
              <p className="text-emerald-600/80 text-xs mt-1">Groth16 Verification Active</p>
            </div>

            <div className="mt-6">
              <SubmitProofButton 
                signalHash={phase3.signalHash as `0x${string}`} 
                proofBytes={phase3.proof as `0x${string}`} 
              />
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
