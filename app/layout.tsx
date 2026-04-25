import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Syne } from "next/font/google";
import { SpaceStarfield } from "@/components/space-starfield";
import { SiteFooter } from "@/components/site-footer";
import { Providers } from "./providers";
import "./globals.css";

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Prydox Finance | Lend & Borrow on LitVM",
    template: "%s | Prydox Finance",
  },
  description:
    "Prydox is a two-sided lending protocol on LitVM. Deposit USDC to earn yield. Borrow against zkLTC without selling.",
  icons: {
    icon: "/logo/prydox-logo.png",
    shortcut: "/logo/prydox-logo.png",
    apple: "/logo/prydox-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} ${mono.variable} h-full`}
    >
      <body
        className={`${body.className} relative min-h-full bg-[var(--bg)] text-[var(--fg)] antialiased`}
      >
        <SpaceStarfield />
        <Providers>
          <div className="relative z-10 flex min-h-full flex-col">
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
