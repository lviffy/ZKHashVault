import Link from "next/link";
import { runPhase3CreditAndZkStep } from "../../../services/strategy/src/phase3";
import { StrategySnapshotCache } from "../../../services/strategy/src/snapshotCache";
import { runStrategyTick } from "../../../services/strategy/src";
import { askAIForStrategy } from "../../../services/strategy/src/ai";
import { WalletConnect } from "../components/WalletConnect";
import { MyPositionCard } from "../components/MyPositionCard";
import { SubmitProofButton } from "../components/SubmitProofButton";
import { RebalanceHistory } from "../components/RebalanceHistory";
import { ChatbotBox } from "../components/ChatbotBox";

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
    <div className="relative min-h-screen overflow-x-clip bg-[#07131a] px-6 py-6 text-slate-100 sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(45,212,191,0.18),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.16),transparent_36%),linear-gradient(180deg,#07131a_0%,#081922_50%,#0b202b_100%)]" />
      <div className="grid-surface pointer-events-none absolute inset-0 opacity-60" />

      <nav className="relative mx-auto mb-8 flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-teal-100 hover:opacity-80 transition-opacity">
          <div className="h-4 w-4 rounded-full bg-teal-300" />
          <span className="hidden sm:inline">ZKHashVault</span>
        </Link>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-300/80">
          <span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span></span> Live Engine</span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Network: Hashkey Testnet</span>
          <WalletConnect />
        </div>
      </nav>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="rounded-3xl border border-white/20 bg-white/[0.06] p-8 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/90">ZKHashVault Console</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Strategy Overview</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200/80">
            Real-time execution details, credit scoring, and zero-knowledge proofs.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-3 items-stretch">
          <div className="lg:col-span-1 flex flex-col gap-4 h-full relative">
            <MyPositionCard />
            
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 mt-auto">
              <article className={`rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur ${!strategyResult.ok ? 'opacity-50 grayscale' : ''}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80 truncate">Expected APY</p>
                <p className="mt-3 text-2xl lg:text-3xl font-semibold text-white">
                  {strategyResult.ok && strategyResult.policy ? (strategyResult.policy.expectedNetApyBps / 100).toFixed(2) : "0.00"}%
                </p>
              </article>
              <article className={`rounded-2xl border border-white/15 bg-white/[0.05] p-5 backdrop-blur ${!strategyResult.ok ? 'opacity-50 grayscale' : ''}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80 truncate">Risk Class</p>
                <p className="mt-3 text-2xl lg:text-3xl font-semibold text-cyan-100">
                  {strategyResult.ok && strategyResult.policy ? strategyResult.policy.riskClass.toUpperCase() : "N/A"}
                </p>
              </article>
            </div>
          </div>
          
          <div className="lg:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {!strategyResult.ok && (
              <article className="rounded-2xl border border-rose-400/40 bg-rose-950/40 p-6 backdrop-blur sm:col-span-2">
                <div className="flex items-center gap-3 text-rose-200 font-semibold text-lg mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Strategy Rejected by Vault Constraints
                </div>
                <p className="text-rose-100/90 text-sm">
                  The AI Rebalance Instruction was <strong>cryptographically blocked</strong> because it violates the Vault's strict safety parameters via ZK logic.
                  <br /><br />
                  <span className="font-mono text-xs bg-rose-100/15 border border-rose-300/30 px-2 py-1 flex mt-2 w-max rounded text-rose-100">
                    Reason: {strategyResult.reason}
                  </span>
                </p>
              </article>
            )}

            <article className={`rounded-2xl border border-teal-300/30 bg-teal-400/10 p-6 sm:col-span-2 flex flex-col justify-between overflow-hidden relative backdrop-blur ${!strategyResult.ok ? 'hidden' : ''}`}>
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-teal-200/30 opacity-60 blur-2xl"></div>
              <p className="text-xs uppercase tracking-[0.2em] text-teal-100 font-semibold">Active Strategy Insight</p>
              <p className="mt-2 text-sm leading-relaxed text-teal-50 z-10 max-w-lg">
                Your vault is currently operating within a <strong>{strategyResult.ok && strategyResult.policy ? strategyResult.policy.riskClass.toUpperCase() : "N/A"}</strong> risk parameter. 
                Capital automatically flows to secure yielding assets while maintaining strict health factor thresholds protecting your position.
              </p>
            </article>
            
            <div className="sm:col-span-2">
              <ChatbotBox />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200/80">Gemini AI Target Allocation</h2>
              <p className="mt-2 text-sm text-slate-300/80">
                The AI engine has analyzed market conditions and recommends the following portfolio breakdown.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-emerald-200">Aave USDC Pool</span>
                <span className="text-emerald-200">
                  {geminiSuggestion?.allocations?.["Aave USDC Pool"] ? (geminiSuggestion.allocations["Aave USDC Pool"] / 100).toFixed(1) : "50.0"}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-1000" 
                  style={{ width: `${geminiSuggestion?.allocations?.["Aave USDC Pool"] ? (geminiSuggestion.allocations["Aave USDC Pool"] / 100) : 50}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm font-medium mt-2">
                <span className="text-cyan-200">Compound avUSD Pool</span>
                <span className="text-cyan-200">
                  {geminiSuggestion?.allocations?.["Compound avUSD Pool"] ? (geminiSuggestion.allocations["Compound avUSD Pool"] / 100).toFixed(1) : "50.0"}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 rounded-full transition-all duration-1000" 
                  style={{ width: `${geminiSuggestion?.allocations?.["Compound avUSD Pool"] ? (geminiSuggestion.allocations["Compound avUSD Pool"] / 100) : 50}%` }}
                />
              </div>
            </div>

            {geminiSuggestion?.reasoning && (
              <div className="mt-6 rounded-xl bg-white/[0.03] p-4 border border-white/10">
                <p className="text-xs font-semibold text-slate-300/80 mb-1">AI REASONING</p>
                <p className="text-sm text-slate-100/90 italic">"{geminiSuggestion.reasoning}"</p>
              </div>
            )}
          </article>
          
          <article className="rounded-2xl border border-white/15 bg-white/[0.05] p-6 backdrop-blur flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200/80">Cryptographic Security</h2>
              <p className="mt-2 text-sm text-slate-300/80">
                Your position is secured by zero-knowledge proofs. The system natively rejects any AI instruction that violates health factor and slippage thresholds on-chain.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center py-6 rounded-xl border border-white/10 bg-white/[0.04]">
              <div className={`h-16 w-16 rounded-full ${strategyResult.ok ? 'bg-emerald-300/15' : 'bg-rose-300/15'} flex items-center justify-center mb-4`}>
                {strategyResult.ok ? (
                  <svg className="w-8 h-8 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <p className={`${strategyResult.ok ? 'text-emerald-100' : 'text-rose-100'} font-semibold text-lg`}>
                {strategyResult.ok ? 'Protected by ZK-Snarks' : 'Contract Execution Blocked'}
              </p>
              <p className={`${strategyResult.ok ? 'text-emerald-200/80' : 'text-rose-200/80'} text-xs mt-1`}>
                Groth16 Verification Active
              </p>
            </div>

            <div className="mt-6">
              <SubmitProofButton 
                signalHash={phase3.signalHash as `0x${string}`} 
                proofBytes={phase3.proof as `0x${string}`} 
                disabled={!strategyResult.ok}
              />
            </div>
            
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-xs uppercase tracking-[0.22em] text-slate-300/80 font-semibold mb-4">On-Chain Rebalance History</h3>
              <RebalanceHistory />
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
