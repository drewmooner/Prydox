import Link from "next/link";
import { explorerAddress, prydoxConfig } from "@/app/lib/prydox-config";

function Addr({
  label,
  address,
}: {
  label: string;
  address: string;
}) {
  return (
    <div className="border-b border-[var(--border)] py-4 last:border-b-0">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </div>
      <code className="font-mono-tight block break-all text-[var(--fg)]">
        {address}
      </code>
      <Link
        href={explorerAddress(address)}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-[12px] text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
      >
        Explorer
      </Link>
    </div>
  );
}

export function ProtocolReference() {
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
      <p className="mb-8 text-xl font-semibold text-[var(--fg)] md:text-2xl">
        Deployment
      </p>
      <div className="grid gap-0 md:grid-cols-2 md:gap-x-12">
        <Addr label="Pool" address={prydoxConfig.pool} />
        <Addr
          label="PoolAddressesProvider"
          address={prydoxConfig.poolAddressesProvider}
        />
        <Addr label="Oracle" address={prydoxConfig.oracle} />
        <Addr
          label="PoolDataProvider"
          address={prydoxConfig.poolDataProvider}
        />
        <Addr label="USDC" address={prydoxConfig.tokens.USDC} />
        <Addr label="zkLTC" address={prydoxConfig.tokens.LTC} />
      </div>
      <p className="mt-8 text-[12px] leading-relaxed text-[var(--muted)]">
        Chain {prydoxConfig.chainId} · RPC and addresses configurable via{" "}
        <code className="font-mono-tight text-[var(--fg)]">.env.local</code>
      </p>
    </div>
  );
}
