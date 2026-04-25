import { LandingHeader } from "@/components/landing-header";
import { LandingThemedBackdrop } from "@/components/landing-themed-backdrop";

export default function AboutPage() {
  return (
    <>
      <LandingHeader />
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      <LandingThemedBackdrop />
      <main className="relative z-10 mx-auto max-w-[1100px] px-4 py-14 md:px-8 md:py-16">
        <p className="font-mono-tight text-[11px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
          About
        </p>
        <h1 className="mt-3 text-[38px] font-semibold tracking-tight text-[var(--fg)] md:text-[46px]">
          A professional liquidity protocol focused on durability.
        </h1>
        <p className="mt-4 max-w-[780px] text-[16px] leading-relaxed text-[#c7d5cd]">
          Prydox is designed for transparent risk management, reliable collateralized borrowing, and predictable
          money market behavior on LitVM Testnet.
        </p>

        <section className="mt-12 grid gap-9 border-t border-[var(--border)] pt-8 md:grid-cols-2">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">What We Build</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              A non-custodial protocol where lenders earn yield and borrowers unlock liquidity without selling core
              assets.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">How We Operate</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              On-chain accounting, explicit collateral constraints, and user-visible health metrics across all flows.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Who It Serves</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Traders, liquidity providers, and builders who need composable capital tools with clear risk surfaces.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Current Stage</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Live on LitVM Testnet with product iteration focused on interface quality, reliability, and user trust.
            </p>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}

