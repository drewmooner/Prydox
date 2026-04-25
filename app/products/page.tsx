import { LandingHeader } from "@/components/landing-header";
import { LandingThemedBackdrop } from "@/components/landing-themed-backdrop";

export default function ProductsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      <LandingThemedBackdrop />
      <LandingHeader />
      <main className="relative z-10 mx-auto max-w-[1100px] px-4 py-14 md:px-8 md:py-16">
        <p className="font-mono-tight text-[11px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
          Products
        </p>
        <h1 className="mt-3 text-[38px] font-semibold tracking-tight text-[var(--fg)] md:text-[46px]">
          Lending and borrowing primitives for LitVM.
        </h1>
        <p className="mt-4 max-w-[780px] text-[16px] leading-relaxed text-[#c7d5cd]">
          Prydox is a non-custodial money market where users supply stable liquidity, borrow against
          collateral, and execute atomic flash liquidity strategies with transparent on-chain risk parameters.
        </p>

        <section className="mt-12 grid gap-10 border-t border-[var(--border)] pt-8 md:grid-cols-2">
          <div>
            <h2 className="text-[22px] font-semibold text-[var(--fg)]">Lend</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Supply supported assets and earn utilization-driven yield from live borrower demand.
            </p>
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-[var(--fg)]">Borrow</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Lock zkLTC as collateral to access USDC liquidity while maintaining long-term market exposure.
            </p>
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-[var(--fg)]">Flash Loans</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Source one-transaction liquidity for arbitrage, refinancing, and automated execution flows.
            </p>
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-[var(--fg)]">Positions</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Monitor supplied balances, outstanding debt, and account health from a single portfolio view.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

