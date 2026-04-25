import { LandingHeader } from "@/components/landing-header";
import { LandingThemedBackdrop } from "@/components/landing-themed-backdrop";

export default function DevelopersPage() {
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
          Build with Prydox on LitVM Testnet.
        </h1>
        <p className="mt-4 max-w-[780px] text-[16px] leading-relaxed text-[#c7d5cd]">
          Access reserve state, user positions, and transaction execution rails to integrate lending markets into
          wallets, analytics platforms, and strategy automation systems.
        </p>

        <section className="mt-12 grid gap-9 border-t border-[var(--border)] pt-8 md:grid-cols-2">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Read Data</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Query reserve liquidity, rates, and account metrics to power high-context interfaces.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Write Transactions</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Execute supply, withdraw, borrow, repay, and flash interactions with predictable transaction states.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Handle Risk UX</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Surface collateralization and health factor data clearly to reduce user-side risk confusion.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Ship Faster</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Start from protocol pages and hooks already used in-app, then compose for your own frontend workflows.
            </p>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
