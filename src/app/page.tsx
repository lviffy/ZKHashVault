import { runPhase3CreditAndZkStep } from "../../services/strategy/src/phase3";
import { StrategySnapshotCache } from "../../services/strategy/src/snapshotCache";
import { runStrategyTick } from "../../services/strategy/src";

export default async function Home() {
  const cache = new StrategySnapshotCache();
  const strategyResult = await runStrategyTick({
    snapshot: {
      timestamp: Date.now(),
      poolAApyBps: 1140,
      poolBApyBps: 980,
      volatilityBps: 540,
      oraclePrice: 2100,
    },
    currentPoolABps: 5000,
    config: {
      cadenceSeconds: 600,
      maxRebalanceDeltaBps: 450,
      minOraclePrice: 1200,
      maxOraclePrice: 3500,
    },
    cache,
  });

  const phase3 = runPhase3CreditAndZkStep({
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
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#d4f7e6,transparent_36%),radial-gradient(circle_at_80%_0%,#dbeafe,transparent_32%),#f7faf7] px-6 py-10 text-slate-900 sm:px-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-emerald-200 bg-white/80 p-8 shadow-[0_20px_60px_-25px_rgba(16,185,129,0.35)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">AdaptiveVault</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Phase 4 Strategy Console</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            Strategy output, cached policy state, credit score model output, and safety-proof payload are surfaced together so the rebalance rationale is immediately visible.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Expected APY</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {strategyResult.ok && strategyResult.policy ? (strategyResult.policy.expectedNetApyBps / 100).toFixed(2) : "0.00"}%
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credit Score</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{phase3.creditScore}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Strategy Cadence</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">10m</p>
          </article>
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
          </article>
        </section>
      </main>
    </div>
  );
}
