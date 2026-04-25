"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "wagmi/actions";
import { useConfig } from "wagmi";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { usePoolReserves } from "@/hooks/use-pool-reserves";
import { useUserPositions } from "@/hooks/use-user-positions";
import { poolDataProviderAbi } from "@/lib/abi/pool-data-provider";
import { wrappedTokenGatewayAbi } from "@/lib/abi/wrapped-gateway";
import { litvmLiteforge } from "@/lib/chain";

function contractShort(addr?: string) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="font-mono-tight uppercase tracking-[0.12em] text-[var(--muted-2)]">
        {label}
      </span>
      <span className="rounded-[6px] border border-[var(--border)] bg-[var(--surface2)] px-2 py-1 font-mono-tight text-[var(--muted)]">
        {contractShort(value)}
      </span>
    </div>
  );
}

export function HomePositionsDashboard() {
  const config = useConfig();
  const { data, isLoading } = useUserPositions();
  const { data: reserves } = usePoolReserves();

  const apyMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of reserves ?? []) m[r.symbol.toUpperCase()] = r.supplyApyPct;
    return m;
  }, [reserves]);

  const tokenContracts = useQuery({
    queryKey: ["home-position-contracts", prydoxConfig.poolDataProvider],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) return null;

      const usdc = prydoxConfig.tokens.USDC as `0x${string}`;
      const ltc = prydoxConfig.tokens.LTC as `0x${string}`;
      const zkltc = await client.readContract({
        address: prydoxConfig.wrappedTokenGateway as `0x${string}`,
        abi: wrappedTokenGatewayAbi,
        functionName: "getWETHAddress",
      });
      const [usdcTokens, ltcTokens, zkltcTokens] = await Promise.all([
        client.readContract({
          address: prydoxConfig.poolDataProvider as `0x${string}`,
          abi: poolDataProviderAbi,
          functionName: "getReserveTokensAddresses",
          args: [usdc],
        }),
        client.readContract({
          address: prydoxConfig.poolDataProvider as `0x${string}`,
          abi: poolDataProviderAbi,
          functionName: "getReserveTokensAddresses",
          args: [ltc],
        }),
        client.readContract({
          address: prydoxConfig.poolDataProvider as `0x${string}`,
          abi: poolDataProviderAbi,
          functionName: "getReserveTokensAddresses",
          args: [zkltc],
        }),
      ]);
      return {
        USDC: { underlying: usdc, aToken: usdcTokens[0], debtToken: usdcTokens[2] },
        LTC: { underlying: ltc, aToken: ltcTokens[0], debtToken: ltcTokens[2] },
        ZKLTC: {
          underlying: zkltc,
          aToken: zkltcTokens[0],
          debtToken: zkltcTokens[2],
        },
      } as const;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-8">
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4 text-[13px] text-[var(--muted)]">
          Loading your positions...
        </div>
      </div>
    );
  }

  const suppliedRows = [data.usdc, data.ltc];
  const debtRows = [data.usdc, data.ltc, data.zkltc];
  const supplied = suppliedRows.filter((r) => r.suppliedWei > BigInt(0));
  const borrowed = debtRows.filter((r) => r.variableDebtWei > BigInt(0));

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-14 pt-8 md:px-8">
      <div className="mb-5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--muted-2)]">
          Dashboard
        </p>
        <h1 className="mt-1 text-[20px] font-semibold text-[var(--fg)]">
          Your positions
        </h1>
        <p className="mt-1 text-[12px] text-[var(--muted)]">
          Real-time pool positions. Landing content is hidden while you hold an
          active position.
        </p>
      </div>

      {data.account ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
              Collateral
            </p>
            <p className="mt-1 font-mono-tight text-[16px] text-[var(--fg)]">
              {data.account.totalCollateralUsd}
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
              Debt
            </p>
            <p className="mt-1 font-mono-tight text-[16px] text-[var(--danger)]">
              {data.account.totalDebtUsd}
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
              Health
            </p>
            <p className="mt-1 font-mono-tight text-[16px] text-[var(--fg)]">
              {data.account.healthFactor ?? "—"}
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
              Available
            </p>
            <p className="mt-1 font-mono-tight text-[16px] text-[var(--accent-bright)]">
              {data.account.availableBorrowsUsd}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
            Supplies
          </p>
          {supplied.length === 0 ? (
            <p className="text-[12px] text-[var(--muted)]">No supplied assets.</p>
          ) : (
            <div className="space-y-3">
              {supplied.map((row) => (
                <div
                  key={`s-${row.symbol}`}
                  className="rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[var(--fg)]">
                      {row.symbol === "ZKLTC" ? "zkLTC" : row.symbol}
                    </p>
                    <p className="font-mono-tight text-[13px] text-[var(--fg)]">
                      {row.supplied}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--positive)]">
                    APY {(
                      apyMap[row.symbol] ??
                      (row.symbol === "ZKLTC" ? apyMap.LTC : 0)
                    ).toFixed(2)}
                    %
                  </p>
                  <div className="mt-2 space-y-1">
                    <Chip
                      label="Token"
                      value={tokenContracts.data?.[row.symbol]?.underlying ?? "—"}
                    />
                    <Chip
                      label="aToken"
                      value={tokenContracts.data?.[row.symbol]?.aToken ?? "—"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--muted-2)]">
            Borrows
          </p>
          {borrowed.length === 0 ? (
            <p className="text-[12px] text-[var(--muted)]">No active borrow positions.</p>
          ) : (
            <div className="space-y-3">
              {borrowed.map((row) => (
                <div
                  key={`b-${row.symbol}`}
                  className="rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[var(--fg)]">
                      {row.symbol === "ZKLTC" ? "zkLTC" : row.symbol}
                    </p>
                    <p className="font-mono-tight text-[13px] text-[var(--danger)]">
                      {row.variableDebt}
                    </p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Chip
                      label="Token"
                      value={tokenContracts.data?.[row.symbol]?.underlying ?? "—"}
                    />
                    <Chip
                      label="Debt"
                      value={tokenContracts.data?.[row.symbol]?.debtToken ?? "—"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

