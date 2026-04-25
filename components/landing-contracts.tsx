import { prydoxConfig, explorerAddress } from "@/app/lib/prydox-config";
import { SectionHeading } from "@/components/section-heading";

const LINKS: { label: string; address: string }[] = [
  { label: "Pool", address: prydoxConfig.pool },
  { label: "PoolAddressesProvider", address: prydoxConfig.poolAddressesProvider },
  { label: "Oracle", address: prydoxConfig.oracle },
  { label: "PoolDataProvider", address: prydoxConfig.poolDataProvider },
  { label: "WrappedTokenGateway", address: prydoxConfig.wrappedTokenGateway },
  { label: "USDC", address: prydoxConfig.tokens.USDC },
  { label: "zkLTC", address: prydoxConfig.tokens.LTC },
];

export function LandingContracts() {
  return (
    <section
      id="contracts"
      className="mx-auto max-w-[1160px] px-6 py-16 md:px-12 lg:px-[48px]"
    >
      <SectionHeading
        title="Contracts (LitVM)"
        titleClassName="!text-[clamp(24px,3vw,34px)]"
        subtitle={`Authoritative deployment addresses on ${prydoxConfig.name}. Verify bytecode and ownership on the explorer before interacting with the protocol.`}
      />
      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {LINKS.map((item) => (
          <li key={item.label}>
            <a
              href={explorerAddress(item.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition-colors hover:border-[var(--ltc-line)] hover:bg-[var(--surface2)]"
            >
              <span className="text-[13px] font-medium text-[var(--fg)]">
                {item.label}
              </span>
              <span className="font-mono-tight text-[11px] text-[var(--muted)]">
                {item.address.slice(0, 6)}…{item.address.slice(-4)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
