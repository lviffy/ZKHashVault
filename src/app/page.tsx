import Link from "next/link";
import { LandingNavAction } from "./components/LandingNavAction";

export default function LandingPage() {
  const featureCards = [
    {
      title: "ZK-Proven Safety Envelope",
      description:
        "Before any rebalance executes, Groth16 proofs attest that health and drawdown boundaries still hold.",
      detail: "On-chain verification",
    },
    {
      title: "Live Credit-Aware Capital",
      description:
        "A passport score updates from wallet behavior and market context to keep exposure adaptive, not static.",
      detail: "Dynamic position sizing",
    },
    {
      title: "Adaptive Multi-Protocol Routing",
      description:
        "The strategy engine compares yield quality, volatility, and slippage before routing across integrated venues.",
      detail: "Aave + Compound ready",
    },
    {
      title: "Auditable Rebalance Trail",
      description:
        "Every allocation move is recorded with rationale, proof status, and transaction links for full operator transparency.",
      detail: "Explorer-linked history",
    },
  ];

  const promptExamples = [
    "Why did my allocation change this hour?",
    "Show a safer version of my strategy with lower drawdown.",
    "Compare my current route to a Compound-heavy route.",
    "Explain this rebalance in plain language.",
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#07131a] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(45,212,191,0.22),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.18),transparent_42%),linear-gradient(180deg,#07131a_0%,#081922_50%,#0b202b_100%)]" />
      <div className="grid-surface pointer-events-none absolute inset-0 opacity-70" />
      <div className="hero-orb pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="hero-orb pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />

      <nav className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-300/30 bg-teal-300/10">
            <div className="h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.6)]" />
          </div>
          <div>
            <p className="text-sm tracking-[0.24em] text-teal-200/80">ZKHashVault</p>
            <p className="text-xs text-slate-300/70">Autonomous Yield Integrity</p>
          </div>
        </div>
        <LandingNavAction />
      </nav>

      <main className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10 lg:pb-24 lg:pt-14">
        <section className="reveal-up space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-100/10 px-4 py-1.5 text-xs font-medium tracking-[0.16em] text-cyan-100/90">
            CRYPTOGRAPHICALLY ENFORCED YIELD VAULT
          </div>

          <div className="space-y-6">
            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              A portfolio engine that
              <span className="bg-gradient-to-r from-cyan-200 via-teal-200 to-emerald-200 bg-clip-text text-transparent"> proves risk control</span>
              before capital moves.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-200/85">
              ZKHashVault combines AI strategy routing, credit-aware allocation, and on-chain zero-knowledge safety checks so users get higher confidence, not just higher APY claims.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-gradient-to-r from-teal-300 to-cyan-300 px-7 py-3 text-sm font-semibold text-slate-900 shadow-[0_10px_40px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_46px_rgba(34,211,238,0.45)]"
            >
              Open Strategy Console
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-slate-100 transition hover:border-teal-200/55 hover:bg-white/5"
            >
              Explore Protocol Design
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300/70">Safety Validations</p>
              <p className="mt-2 text-2xl font-semibold text-teal-100">Per Rebalance</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300/70">Execution Model</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-100">Adaptive AI</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300/70">Auditability</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-100">On-chain Trail</p>
            </div>
          </div>
        </section>

        <aside className="reveal-up reveal-up-delay-1 relative">
          <div className="relative space-y-6 rounded-3xl border border-white/20 bg-slate-950/65 p-6 shadow-xl shadow-black/25 backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Live Strategy Snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Current Engine State</h2>
              </div>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                Policy Locked
              </span>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Target Yield Band</span>
                <span className="font-semibold text-slate-100">8.9% - 11.6%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Risk Profile</span>
                <span className="font-semibold text-cyan-200">Balanced Dynamic</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Proof Status</span>
                <span className="font-semibold text-emerald-200">Verified On-chain</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300/80">Ask The Assistant</p>
              <ul className="space-y-2">
                {promptExamples.map((prompt) => (
                  <li
                    key={prompt}
                    className="rounded-xl border border-cyan-200/15 bg-cyan-100/5 px-3 py-2 text-sm text-cyan-50/90"
                  >
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </main>

      <section id="how-it-works" className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10 lg:pb-32">
        <div className="reveal-up reveal-up-delay-2 mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-200/75">Protocol Features</p>
            <h3 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built for investors who want explainable automation, not black-box rebalancing.
            </h3>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            View Live Dashboard
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {featureCards.map((feature, index) => (
            <article
              key={feature.title}
              className="reveal-up rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-white/[0.07]"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/75">{feature.detail}</p>
              <h4 className="mt-3 text-xl font-semibold text-white">{feature.title}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-200/80">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
