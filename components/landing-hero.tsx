import { LandingConnectPrimary } from "@/components/landing-connect-button";
import { LandingHeroStats } from "@/components/landing-hero-stats";

export function LandingHero() {
  return (
    <div className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-x-hidden overflow-y-visible px-6 pb-24 pt-28 text-center md:px-12 md:pb-28 md:pt-32">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(52,93,157,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(52,93,157,0.04)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_85%_65%_at_50%_38%,black_0%,transparent_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[18%] h-[320px] w-[640px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(52,93,157,0.14)_0%,transparent_72%)]"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto w-full max-w-[min(100%,820px)]">
        <p className="font-mono-tight text-[11px] font-medium uppercase tracking-[0.38em] text-[var(--muted-2)]">
          Prydox · LitVM
        </p>

        <h1 className="font-display mt-6 text-[clamp(40px,6.5vw,76px)] font-extrabold leading-[1.02] tracking-[-0.055em] text-[var(--fg)] md:mt-7">
          Lend. Borrow.
          <br />
          <span className="bg-gradient-to-br from-[var(--ltc-bright)] to-[#6b9bd9] bg-clip-text text-transparent">
            Own your liquidity.
          </span>
        </h1>

        <p className="font-body mx-auto mt-8 max-w-[34rem] text-[clamp(16px,1.9vw,18px)] font-normal leading-[1.7] text-[var(--muted)] text-pretty md:mt-9">
          One pool on LitVM: supply USDC for yield paid by borrowers, or borrow
          USDC against zkLTC—fully on-chain, no custodians.
        </p>

        <div className="mx-auto mt-12 flex max-w-md flex-col items-stretch gap-3 sm:mx-0 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4 md:mt-14">
          <LandingConnectPrimary variant="hero" />
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-[10px] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-8 py-[13px] text-[15px] font-semibold text-[var(--muted)] transition-colors hover:border-[var(--ltc-line)] hover:bg-[rgba(52,93,157,0.06)] hover:text-[var(--fg)]"
          >
            How it works
          </a>
        </div>

        <LandingHeroStats />
      </div>
    </div>
  );
}
