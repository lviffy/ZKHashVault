import Link from "next/link";
import { runPhase3CreditAndZkStep } from "../../../services/strategy/src/phase3";
import { StrategySnapshotCache } from "../../../services/strategy/src/snapshotCache";
import { runStrategyTick } from "../../../services/strategy/src";
import { EvmVaultExecutor } from "../../../services/strategy/src/executionWorker";
import { WalletConnect } from "../components/WalletConnect";
import { DepositWithdrawForm } from "../components/DepositWithdrawForm";
import { SubmitProofButton } from "../components/SubmitProofButton";

const DEMO_SNAPSHOT_TIMESTAMP = 1_776_000_000;

export default async function DashboardHome() {
  const snapshotTimestamp = DEMO_SNAPSHOT_TIMESTAMP;
  const executor = EvmVaultExecutor.fromEnv();
  const cache = new StrategySnapshotCache();
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
    executor: executor ?? undefined,
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
          <span className="rounded-full bg-white px-3 py-1 shadow-sm border border-slate-200">Network: EVM Local</span>
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
            <DepositWithdrawForm />
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
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credit Score</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{phase3.creditScore}</p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Rebalance Instruction</h2>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">
              {JSON.stringify(strategyResult, null, 2)}
            </pre>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Safety Proof Payload</h2>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-cyan-200">
              {JSON.stringify(phase3, null, 2)}
            </pre>
            <SubmitProofButton 
              signalHash={phase3.signalHash as `0x${string}`} 
              proofBytes={phase3.proof as `0x${string}`} 
            />
          </article>
        </section>
      </main>
    </div>
  );
}
