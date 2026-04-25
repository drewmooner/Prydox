import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";
import { LandingThemedBackdrop } from "@/components/landing-themed-backdrop";

export default function CommunityPage() {
  return (
    <>
      <LandingHeader />
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      <LandingThemedBackdrop />
      <main className="relative z-10 mx-auto max-w-[1100px] px-4 py-14 md:px-8 md:py-16">
        <p className="font-mono-tight text-[11px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
          Community
        </p>
        <h1 className="mt-3 text-[38px] font-semibold tracking-tight text-[var(--fg)] md:text-[46px]">
          Builders, liquidity providers, and users growing together.
        </h1>
        <p className="mt-4 max-w-[780px] text-[16px] leading-relaxed text-[#c7d5cd]">
          The Prydox community centers on clear product feedback, transparent risk education, and collaborative
          iteration across protocol interfaces and developer tooling.
        </p>

        <section className="mt-12 grid gap-9 border-t border-[var(--border)] pt-8 md:grid-cols-2">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Product Feedback</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Help shape UX, market behavior visibility, and execution flows through practical user reports.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Market Education</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Understand utilization, APY movement, and collateral risk so decisions are better informed.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Developer Participation</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Integrators and automation builders contribute patterns that improve ecosystem composability.
            </p>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--fg)]">Get Involved</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#c7d5cd]">
              Start with protocol flows in{" "}
              <Link href="/markets" className="text-[var(--accent-bright)] hover:text-[var(--fg)]">
                Markets
              </Link>{" "}
              and share practical feedback as you use the platform.
            </p>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
