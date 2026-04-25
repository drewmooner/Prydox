import { LandingHeader } from "@/components/landing-header";
import { LandingThemedBackdrop } from "@/components/landing-themed-backdrop";

export default function SecurityPage() {
  return (
    <>
      <LandingHeader />
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      <LandingThemedBackdrop />
      <main className="relative z-10 mx-auto max-w-[1100px] px-4 py-14 md:px-8 md:py-16">
        <p className="font-mono-tight text-[11px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
          Security
        </p>
        <h1 className="mt-3 text-[38px] font-semibold tracking-tight text-[var(--fg)] md:text-[46px]">
          Risk controls and protocol safety posture.
        </h1>
        <p className="mt-4 max-w-[780px] text-[16px] leading-relaxed text-[#c7d5cd]">
          Prydox emphasizes transparent collateral management, explicit account health metrics, and deterministic
          settlement flows to minimize hidden risk.
        </p>

        <section className="mt-12 grid gap-9 border-t border-[var(--border)] pt-8 md:grid-cols-2">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Collateral Parameters</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Borrow limits are enforced against posted collateral using protocol-defined thresholds.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Health Factor Monitoring</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Account-level health indicators surface liquidation risk in real time as conditions change.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Atomic Flash Guarantees</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Flash liquidity settles in one transaction or reverts, reducing lingering execution risk.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Operational Discipline</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Users should verify addresses, transaction previews, and expected approvals before signing.
            </p>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
