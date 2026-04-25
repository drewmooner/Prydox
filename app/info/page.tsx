import Link from "next/link";
import { Fustat, Inter } from "next/font/google";
import { LandingHeader } from "@/components/landing-header";

const fustat = Fustat({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-fustat",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export default function InfoPage() {
  return (
    <main
      className={`${fustat.variable} ${inter.variable} min-h-screen bg-[#040806] text-[#e9f4ee] [font-family:var(--font-inter),Inter,sans-serif]`}
    >
      <LandingHeader />

      <div className="mx-auto w-full max-w-[1600px] px-6 pb-16 pt-10 md:px-10">
        <section id="products" className="mb-16 scroll-mt-28">
          <h3 className="text-[36px] leading-[1.08] tracking-[-1px] text-[#effff5] [font-family:var(--font-fustat),Fustat,sans-serif] md:text-[42px]">
            Powerful. Secure. Decentralized.
          </h3>
          <p className="mt-3 max-w-[900px] text-[18px] tracking-[-0.2px] text-[#c6ded2]">
            Prydox delivers institutional-grade lending and borrowing rails on LitVM with transparent pricing,
            verifiable collateral risk, and deep on-chain liquidity.
          </p>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mt-1 text-[20px] font-semibold tracking-tight text-[#eafff3]">Lend Assets</p>
              <p className="mt-1 text-[15px] leading-[1.45] text-[#b2c8bd]">Supply liquidity and earn utilization-linked yield.</p>
            </div>
            <div>
              <p className="mt-1 text-[20px] font-semibold tracking-tight text-[#eafff3]">Borrow Liquidity</p>
              <p className="mt-1 text-[15px] leading-[1.45] text-[#b2c8bd]">Post collateral and draw stable liquidity instantly.</p>
            </div>
            <div>
              <p className="mt-1 text-[20px] font-semibold tracking-tight text-[#eafff3]">Flash Loans</p>
              <p className="mt-1 text-[15px] leading-[1.45] text-[#b2c8bd]">Access atomic liquidity for single-tx execution.</p>
            </div>
            <div>
              <p className="mt-1 text-[20px] font-semibold tracking-tight text-[#eafff3]">Non-Custodial</p>
              <p className="mt-1 text-[15px] leading-[1.45] text-[#b2c8bd]">You keep control of assets and positions.</p>
            </div>
          </div>
        </section>

        <section id="developer" className="mb-16 scroll-mt-28">
          <h3 className="text-[30px] tracking-[-0.7px] text-[#eafff2] [font-family:var(--font-fustat),Fustat,sans-serif]">
            Built for LitVM Testnet
          </h3>
          <p className="mt-2 text-[16px] text-[#aed3bf]">
            Where secure lending meets composable liquidity, and every block moves capital forward.
          </p>
          <Link
            href="/markets"
            className="mt-4 inline-flex items-center rounded-[12px] border border-[#1d7f50] bg-[#0f9a5f] px-4 py-2 text-[14px] font-medium text-white shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25)]"
          >
            Use Prydox
          </Link>
        </section>

        <section id="docs" className="mb-16 scroll-mt-28">
          <h3 className="text-[24px] text-[#dcf6e8] [font-family:var(--font-fustat),Fustat,sans-serif]">Docs</h3>
          <p className="mt-2 max-w-[920px] text-[15px] text-[#a7bdaf]">
            Protocol documentation covers reserve mechanics, collateral risk parameters, transaction flows, and
            integration patterns for wallets, frontends, and automation.
          </p>
        </section>

        <section id="about" className="mb-16 scroll-mt-28">
          <h3 className="text-[24px] text-[#dcf6e8] [font-family:var(--font-fustat),Fustat,sans-serif]">About</h3>
          <p className="mt-2 max-w-[920px] text-[15px] text-[#a7bdaf]">
            Prydox is a non-custodial liquidity protocol focused on transparent risk controls, durable collateral
            markets, and predictable on-chain money market mechanics for long-term ecosystem growth.
          </p>
        </section>
      </div>
    </main>
  );
}
