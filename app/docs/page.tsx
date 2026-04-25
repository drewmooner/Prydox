import { LandingHeader } from "@/components/landing-header";
import { LandingThemedBackdrop } from "@/components/landing-themed-backdrop";

export default function DocsPage() {
  return (
    <>
      <LandingHeader />
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      <LandingThemedBackdrop />
      <main className="relative z-10 mx-auto max-w-[1100px] px-4 py-14 md:px-8 md:py-16">
        <p className="font-mono-tight text-[11px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
          Docs
        </p>
        <h1 className="mt-3 text-[38px] font-semibold tracking-tight text-[var(--fg)] md:text-[46px]">
          Protocol documentation and integration references.
        </h1>
        <p className="mt-4 max-w-[780px] text-[16px] leading-relaxed text-[#c7d5cd]">
          Learn core mechanics, risk parameters, and execution flows for lending, borrowing, and flash loan
          operations on Prydox.
        </p>

        <section className="mt-12 grid gap-9 border-t border-[var(--border)] pt-8 md:grid-cols-2">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Markets & Reserves</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Asset listings, utilization behavior, APY calculations, and reserve-level configuration.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Collateral & Borrowing</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Collateral ratios, liquidation boundaries, and account health interpretation.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Transactions</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Approve, supply, withdraw, borrow, and repay transaction flow with expected wallet prompts.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Developer Guides</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Contract interaction patterns and app-level integration guidance for LitVM builders.
            </p>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
