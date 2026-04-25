import { LandingHeader } from "@/components/landing-header";
import { LandingThemedBackdrop } from "@/components/landing-themed-backdrop";

export default function DeveloperPage() {
  return (
    <>
      <LandingHeader />
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      <LandingThemedBackdrop />
      <main className="relative z-10 mx-auto max-w-[1100px] px-4 py-14 md:px-8 md:py-16">
        <p className="font-mono-tight text-[11px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
          Developers
        </p>
        <h1 className="mt-3 text-[38px] font-semibold tracking-tight text-[var(--fg)] md:text-[46px]">
          Integrate Prydox liquidity into your products.
        </h1>
        <p className="mt-4 max-w-[780px] text-[16px] leading-relaxed text-[#c7d5cd]">
          Build dashboards, bots, automation, and wallet workflows on top of LitVM lending markets with deterministic
          contract interactions and transparent reserve data.
        </p>

        <section className="mt-12 border-t border-[var(--border)] pt-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-[19px] font-semibold text-[var(--fg)]">Reserve Data</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#c7d5cd]">
                Pull supplied liquidity, borrow utilization, and APY snapshots for live market surfaces.
              </p>
            </div>
            <div>
              <h2 className="text-[19px] font-semibold text-[var(--fg)]">Account Health</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#c7d5cd]">
                Track collateral, debt, and health factor to power risk-aware UX and alerts.
              </p>
            </div>
            <div>
              <h2 className="text-[19px] font-semibold text-[var(--fg)]">Transaction Rails</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#c7d5cd]">
                Enable deposit, withdraw, borrow, repay, and flash actions with clear transaction states.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}

