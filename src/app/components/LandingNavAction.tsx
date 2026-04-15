"use client";

import Link from "next/link";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function LandingNavAction() {
  const { isConnected } = useAccount();
  const { connect, isPending } = useConnect();

  if (isConnected) {
    return (
      <Link
        href="/dashboard"
        className="rounded-full border border-teal-300/30 bg-teal-300/15 px-5 py-2.5 text-sm font-semibold text-teal-100 transition hover:-translate-y-0.5 hover:bg-teal-300/25"
      >
        Launch App &rarr;
      </Link>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="rounded-full border border-teal-300/30 bg-teal-300/15 px-5 py-2.5 text-sm font-semibold text-teal-100 transition hover:-translate-y-0.5 hover:bg-teal-300/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}