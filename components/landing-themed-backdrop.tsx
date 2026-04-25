import Image from "next/image";

const BTC_LOGO = "https://assets.coingecko.com/coins/images/1/large/bitcoin.png";
const ETH_LOGO = "https://assets.coingecko.com/coins/images/279/large/ethereum.png";
const LTC_LOGO = "https://assets.coingecko.com/coins/images/2/large/litecoin.png";
const USDC_LOGO =
  "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png";

export function LandingThemedBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(46,255,167,0.35),rgba(46,255,167,0)_65%)] blur-[60px]" />
      <div className="pointer-events-none absolute left-[80px] top-[60px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(0,184,107,0.28),rgba(0,184,107,0)_70%)] blur-[70px]" />

      <div className="pointer-events-none absolute right-[6%] top-[120px] hidden h-[380px] w-[380px] overflow-hidden md:block">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 scale-110 mix-blend-screen object-contain [filter:hue-rotate(-105deg)_saturate(230%)_brightness(1.05)_contrast(1.05)]"
          src="https://future.co/images/homepage/glassy-orb/orb-purple.webm"
        />
        <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2">
          <Image
            src={BTC_LOGO}
            alt="BTC"
            width={52}
            height={52}
            className="hero-asset hero-asset-a rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
          />
          <Image
            src={ETH_LOGO}
            alt="ETH"
            width={46}
            height={46}
            className="hero-asset hero-asset-b rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
          />
          <Image
            src={USDC_LOGO}
            alt="USDC"
            width={48}
            height={48}
            className="hero-asset hero-asset-c rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
          />
          <Image
            src={LTC_LOGO}
            alt="zkLTC"
            width={44}
            height={44}
            className="hero-asset hero-asset-d rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>
    </>
  );
}
