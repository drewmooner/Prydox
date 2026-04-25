import { ScrollReveal } from "@/components/scroll-reveal";
import { SectionHeading } from "@/components/section-heading";

const features = [
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: "Real yield for lenders",
    desc: "Deposit USDC into the pool and earn continuous yield paid directly by borrowers. Your pUSDC appreciates every second — no staking, no lock-ups.",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    title: "Borrow without selling",
    desc: "Lock your zkLTC as collateral and borrow up to 70% of its value in USDC. Keep your position, collect your upside, repay whenever you want.",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Algorithmic interest rates",
    desc: "Rates adjust automatically based on pool utilization. High demand means higher yields for lenders and higher cost for borrowers — balancing itself in real time.",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Flash loans",
    desc: "Borrow USDC for one transaction only: repay principal plus premium before the call ends or the whole tx reverts. No ongoing loan — atomic by design.",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Automated liquidations",
    desc: "On-chain liquidation engine monitors every position continuously. Undercollateralized loans are resolved automatically — the protocol stays solvent at all times.",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Native to LitVM",
    desc: "Prydox is built natively on LitVM. No bridges, no dependencies. zkLTC is the collateral asset — designed for this chain from day one.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="mx-auto max-w-[1160px] px-6 py-[72px] md:px-12 lg:px-[48px] lg:py-[100px]"
    >
      <ScrollReveal>
        <SectionHeading
          title={
            <>
              Built for both sides
              <br />
              of the market.
            </>
          }
          subtitle="Lending and borrowing operate in a single shared pool on LitVM: suppliers earn yield from utilization, while borrowers draw USDC against zkLTC under fixed risk parameters. Assets remain in smart contracts—there are no custodial accounts."
        />
      </ScrollReveal>

      <div className="mt-[52px] grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
        {features.map((f, i) => (
          <ScrollReveal
            key={f.title}
            delayClass={
              i % 3 === 0
                ? "reveal-delay-1"
                : i % 3 === 1
                  ? "reveal-delay-2"
                  : "reveal-delay-3"
            }
            className="group relative bg-[var(--surface)] p-8 transition-colors hover:bg-[var(--surface2)] md:p-9"
          >
            <div className="absolute left-0 right-0 top-0 h-0.5 origin-left scale-x-0 bg-[var(--ltc)] transition-transform duration-300 group-hover:scale-x-100" />
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[10px] border border-[var(--ltc-line)] bg-[var(--ltc-glow)] text-[var(--ltc-bright)]">
              {f.icon}
            </div>
            <h3 className="font-display text-[17px] font-semibold text-[var(--fg)]">
              {f.title}
            </h3>
            <p className="mt-2.5 text-[13.5px] leading-[1.7] text-[var(--muted)]">
              {f.desc}
            </p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
