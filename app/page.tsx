import Image from "next/image";
import Link from "next/link";
import { Fustat, Inter } from "next/font/google";
import { LandingHeader } from "@/components/landing-header";
import { LandingLiveStatsStrip } from "@/components/landing-live-stats-strip";

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

const BTC_LOGO = "https://assets.coingecko.com/coins/images/1/large/bitcoin.png";
const ETH_LOGO = "https://assets.coingecko.com/coins/images/279/large/ethereum.png";
const LTC_LOGO = "https://assets.coingecko.com/coins/images/2/large/litecoin.png";
const USDC_LOGO =
  "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png";

export default function Home() {
  return (
    <>
      <LandingHeader />
      <main
        className={`${fustat.variable} ${inter.variable} relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[#e9f4ee] [font-family:var(--font-inter),Inter,sans-serif] [-webkit-font-smoothing:antialiased]`}
      >
      <div className="pointer-events-none absolute left-0 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(46,255,167,0.35),rgba(46,255,167,0)_65%)] blur-[60px]" />
      <div className="pointer-events-none absolute left-[80px] top-[60px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(0,184,107,0.28),rgba(0,184,107,0)_70%)] blur-[70px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-10 px-6 pb-16 pt-12 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section>
          <h1 className="max-w-[860px] text-[42px] leading-[1.06] tracking-[-1.6px] text-[#ebfff3] md:text-[58px] lg:text-[70px] [font-family:var(--font-fustat),Fustat,sans-serif]">
            Borrow smarter. Lend confidently. Grow on LitVM.
          </h1>
          <p className="mt-5 max-w-[700px] text-[18px] tracking-[-0.6px] text-[#b5cbc0]">
            Prydox is a decentralized lending and borrowing protocol built on
            LitVM Testnet. Lock your assets, access liquidity, and power your
            onchain possibilities.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/markets"
              className="inline-flex items-center rounded-[12px] border border-[#1d7f50] bg-[#0f9a5f] px-4 py-2 text-[14px] font-medium text-white shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.25)]"
            >
              Use Prydox
            </Link>
            <a
              href="#products"
              className="text-[14px] font-medium text-[#cde4d8] underline underline-offset-4 hover:text-white"
            >
              How it works
            </a>
          </div>
        </section>

        <section className="relative min-h-[420px]">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-[45%] -translate-y-1/2 overflow-hidden md:h-[430px] md:w-[430px]">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 scale-110 mix-blend-screen object-contain [filter:hue-rotate(-105deg)_saturate(230%)_brightness(1.05)_contrast(1.05)] md:h-[430px] md:w-[430px]"
              src="https://future.co/images/homepage/glassy-orb/orb-purple.webm"
            />
            <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 md:h-[330px] md:w-[330px]">
              <Image
                src={BTC_LOGO}
                alt="BTC"
                width={58}
                height={58}
                className="hero-asset hero-asset-a rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
              />
              <Image
                src={ETH_LOGO}
                alt="ETH"
                width={52}
                height={52}
                className="hero-asset hero-asset-b rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
              />
              <Image
                src={USDC_LOGO}
                alt="USDC"
                width={54}
                height={54}
                className="hero-asset hero-asset-c rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
              />
              <Image
                src={LTC_LOGO}
                alt="zkLTC"
                width={50}
                height={50}
                className="hero-asset hero-asset-d rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>
        </section>
      </div>

      <LandingLiveStatsStrip />

      <div className="relative z-10 mx-auto mt-4 w-full max-w-[1600px] px-6 pb-16 md:px-10">
        <section id="products" className="mb-16 scroll-mt-28">
          <h3 className="text-[36px] leading-[1.08] tracking-[-1px] text-[#effff5] [font-family:var(--font-fustat),Fustat,sans-serif] md:text-[42px]">
            Powerful. Secure. Decentralized.
          </h3>
          <p className="mt-3 max-w-[900px] text-[18px] tracking-[-0.2px] text-[#c6ded2]">
            Prydox delivers institutional-grade lending and borrowing rails on LitVM with transparent pricing,
            verifiable collateral risk, and deep onchain liquidity.
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

        <div id="docs" className="h-px scroll-mt-28" />
        <div id="about" className="h-px scroll-mt-28" />
      </div>
    </main>
    </>
  );
}
