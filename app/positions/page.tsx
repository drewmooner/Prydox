"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "wagmi/actions";
import { formatUnits, isAddress } from "viem";
import { ProtocolAppShell } from "@/components/protocol-app-shell";
import { prydoxConfig } from "@/app/lib/prydox-config";
import { poolDataProviderAbi } from "@/lib/abi/pool-data-provider";
import { wrappedTokenGatewayAbi } from "@/lib/abi/wrapped-gateway";
import { litvmLiteforge } from "@/lib/chain";
import { getFailedBorrowCollateralWei } from "@/lib/failed-borrow-collateral";
import { useUserPositions } from "@/hooks/use-user-positions";
import { usePoolReserves } from "@/hooks/use-pool-reserves";
import { usePoolTransactions } from "@/hooks/use-pool-transactions";
import { useAccount, useConfig, useWalletClient } from "wagmi";

const COINGECKO_USDC_LOGO =
  "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png";
const COINGECKO_LTC_LOGO =
  "https://assets.coingecko.com/coins/images/2/large/litecoin.png";
const LENDER_PROTOCOL_TAKE_PCT = 20;

function toNumber(value: string | null | undefined) {
  if (!value) return 0;
  const cleaned = value.replace(/[$,%]/g, "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function fmtCompact(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtAmount(n: number, maxFrac = 6) {
  if (!Number.isFinite(n) || n <= 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function fmtPct(n: number, maxFrac = 2) {
  if (!Number.isFinite(n) || n <= 0) return "0.00%";
  return `${n.toFixed(maxFrac)}%`;
}

function healthLabel(hf: string | null | undefined) {
  const n = toNumber(hf ?? "");
  if (!hf) return "N/A";
  if (hf === "∞") return "Safe";
  if (n >= 1.5) return "Healthy";
  if (n >= 1.1) return "Warning";
  return "Risk";
}

function shortAddr(addr?: string) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function CopyAddressIconButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex h-5 w-5 items-center justify-center rounded border border-[var(--border)] text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
      title="Copy"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
    </button>
  );
}

export default function PositionsPage() {
  const config = useConfig();
  const { status, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data, hasActivePosition, isLoading, isError, error, refetch } = useUserPositions();
  const { data: reserves } = usePoolReserves();
  const { liquidateUsdcDebt, pending: liquidationPending, txStatus } = usePoolTransactions();
  const [activeTab, setActiveTab] = useState<"lending" | "borrowing">("lending");
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [borrowLiveSeconds, setBorrowLiveSeconds] = useState(0);
  const [suppliedBaseline, setSuppliedBaseline] = useState<Record<string, number>>({});
  const [liquidationUser, setLiquidationUser] = useState("");
  const [liquidationDebtAmount, setLiquidationDebtAmount] = useState("");
  const [liquidationErr, setLiquidationErr] = useState<string | null>(null);
  const { data: failedBorrowCollateralWei = BigInt(0) } = useQuery({
    queryKey: ["failed-borrow-collateral", address, status],
    queryFn: async () => {
      const connectedAddress = address;
      if (!connectedAddress) return BigInt(0);
      return getFailedBorrowCollateralWei(connectedAddress as `0x${string}`);
    },
    enabled: Boolean(address),
    staleTime: 0,
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  });
  const isConnected = status === "connected";
  const healthFactor = data?.account?.healthFactor ?? null;
  const health = healthLabel(healthFactor);
  const healthProgress = Math.min(100, Math.max(0, (toNumber(healthFactor ?? "") / 2) * 100));
  const healthTone =
    health === "Healthy" || health === "Safe"
      ? "text-[#8be4b7]"
      : health === "Warning"
        ? "text-[#f2d37a]"
        : "text-[#f39a9a]";

  const usdcSupplied = toNumber(data?.usdc.supplied);
  const zkltcSupplied = toNumber(data?.zkltc.supplied);
  const failedBorrowCollateralNum = Number(formatUnits(failedBorrowCollateralWei, 18));
  const zkltcLendingSupplied = Math.max(zkltcSupplied - failedBorrowCollateralNum, 0);
  const usdcDebt = toNumber(data?.usdc.variableDebt);
  const totalBorrowed = usdcDebt;
  const totalSupplied = usdcSupplied + zkltcLendingSupplied;

  const reserveBySymbol = useMemo(() => {
    const map = new Map<string, { supplyApyPct: number; variableBorrowApyPct: number }>();
    for (const reserve of reserves ?? []) {
      const sym = reserve.symbol.toUpperCase();
      if (sym === "USDC") {
        map.set("USDC", {
          supplyApyPct: reserve.supplyApyPct,
          variableBorrowApyPct: reserve.variableBorrowApyPct,
        });
      }
      if (sym === "LTC" || sym === "ZKLTC") {
        map.set("ZKLTC", {
          supplyApyPct: reserve.supplyApyPct,
          variableBorrowApyPct: reserve.variableBorrowApyPct,
        });
      }
    }
    return map;
  }, [reserves]);
  const suppliedRows = useMemo(
    () =>
      [
        {
          symbol: "USDC",
          amount: data?.usdc.supplied ?? "0",
          apyPct: reserveBySymbol.get("USDC")?.supplyApyPct ?? 0,
          logo: COINGECKO_USDC_LOGO,
        },
        {
          symbol: "ZKLTC",
          amount: zkltcLendingSupplied.toString(),
          apyPct: reserveBySymbol.get("ZKLTC")?.supplyApyPct ?? 0,
          logo: COINGECKO_LTC_LOGO,
        },
      ].filter((r) => toNumber(r.amount) > 0),
    [data, reserveBySymbol, zkltcLendingSupplied],
  );

  const borrowedRows = useMemo(
    () =>
      [
        {
          symbol: "USDC",
          amount: data?.usdc.variableDebt ?? "0",
          apyPct: reserveBySymbol.get("USDC")?.variableBorrowApyPct ?? 0,
          logo: COINGECKO_USDC_LOGO,
        },
      ].filter((r) => toNumber(r.amount) > 0),
    [data, reserveBySymbol],
  );
  const hasLendingPosition = suppliedRows.length > 0;
  const hasBorrowingPosition = borrowedRows.length > 0;
  const hasLendingOnly = suppliedRows.length > 0 && borrowedRows.length === 0;
  const usdcLendingBalance = toNumber(data?.usdc.supplied);
  const usdcReserve = reserves?.find((r) => r.symbol.toUpperCase() === "USDC");
  const currentBorrowApyPct = usdcReserve?.variableBorrowApyPct ?? 0;
  const usdcPriceUsd = usdcReserve?.usdPrice ?? 1;
  const zkltcReserve = reserves?.find((r) => {
    const sym = r.symbol.toUpperCase();
    return sym === "LTC" || sym === "ZKLTC";
  });
  const zkltcPriceUsd = zkltcReserve?.usdPrice ?? 0;
  const totalSuppliedUsd = usdcSupplied * usdcPriceUsd + zkltcLendingSupplied * zkltcPriceUsd;
  const totalBorrowedUsd = totalBorrowed * usdcPriceUsd;
  const poolLiquidityUsdc = usdcReserve
    ? Math.max(toNumber(usdcReserve.totalSupplied) - toNumber(usdcReserve.totalBorrowedVar), 0)
    : 0;
  const priceBySymbol: Record<string, number> = { USDC: usdcPriceUsd, ZKLTC: zkltcPriceUsd };
  const perSecondRateUsd = suppliedRows.reduce((sum, row) => {
    const amount = toNumber(row.amount);
    const apy = row.apyPct;
    const price = priceBySymbol[row.symbol] ?? 1;
    if (amount <= 0 || apy <= 0) return sum;
    return sum + (amount * price * (apy / 100)) / (365 * 24 * 3600);
  }, 0);
  const liveInterestEarnedUsd = perSecondRateUsd > 0 ? perSecondRateUsd * liveSeconds : 0;
  const principalSuppliedUsd = suppliedRows.reduce((sum, row) => {
    const baseline = suppliedBaseline[row.symbol] ?? toNumber(row.amount);
    const price = priceBySymbol[row.symbol] ?? 1;
    return sum + baseline * price;
  }, 0);
  const accruedInterestUsd = Math.max(totalSuppliedUsd - principalSuppliedUsd, 0);
  const displayedInterestEarnedUsd = accruedInterestUsd + liveInterestEarnedUsd;
  const currentApyPct =
    totalSuppliedUsd > 0
      ? (suppliedRows.reduce((sum, row) => {
          const amount = toNumber(row.amount);
          const apy = row.apyPct;
          const price = priceBySymbol[row.symbol] ?? 1;
          return sum + amount * price * (apy / 100);
        }, 0) /
          totalSuppliedUsd) *
        100
      : 0;
  const borrowPerSecondInterest =
    totalBorrowed > 0 ? (totalBorrowed * (currentBorrowApyPct / 100)) / (365 * 24 * 3600) : 0;
  const accruingBorrowInterest = borrowPerSecondInterest > 0 ? borrowPerSecondInterest * borrowLiveSeconds : 0;
  const accruingBorrowInterestUsd = accruingBorrowInterest * usdcPriceUsd;
  const canFullyWithdraw = poolLiquidityUsdc >= usdcLendingBalance;
  const withdrawalStatus = canFullyWithdraw
    ? { label: "Available", tone: "text-[#8be4b7]" }
    : poolLiquidityUsdc > 0
      ? { label: "Limited liquidity", tone: "text-[#f2d37a]" }
      : { label: "Pool utilized, wait for repayments", tone: "text-[#f39a9a]" };
  const healthNum = toNumber(healthFactor ?? "");
  const isLiquidatableNow = healthFactor !== null && healthFactor !== "∞" && healthNum > 0 && healthNum < 1;
  const liquidationUserTrimmed = liquidationUser.trim();
  const liquidationDebtNum = toNumber(liquidationDebtAmount);
  const canRunLiquidation =
    !liquidationPending &&
    isAddress(liquidationUserTrimmed) &&
    liquidationDebtNum > 0;
  const { data: debtTokenAddress } = useQuery({
    queryKey: ["positions-usdc-debt-token", prydoxConfig.poolDataProvider, prydoxConfig.tokens.USDC],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) return null;
      const tokens = await client.readContract({
        address: prydoxConfig.poolDataProvider as `0x${string}`,
        abi: poolDataProviderAbi,
        functionName: "getReserveTokensAddresses",
        args: [prydoxConfig.tokens.USDC as `0x${string}`],
      });
      return (tokens[1] as `0x${string}`) ?? null;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const { data: usdcPtokenAddress } = useQuery({
    queryKey: ["positions-usdc-ptoken", prydoxConfig.poolDataProvider, prydoxConfig.tokens.USDC],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) return null;
      const tokens = await client.readContract({
        address: prydoxConfig.poolDataProvider as `0x${string}`,
        abi: poolDataProviderAbi,
        functionName: "getReserveTokensAddresses",
        args: [prydoxConfig.tokens.USDC as `0x${string}`],
      });
      return (tokens[0] as `0x${string}`) ?? null;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const { data: zkltcPtokenAddress } = useQuery({
    queryKey: ["positions-zkltc-ptoken", prydoxConfig.poolDataProvider, prydoxConfig.wrappedTokenGateway],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: litvmLiteforge.id });
      if (!client) return null;
      const weth = await client.readContract({
        address: prydoxConfig.wrappedTokenGateway as `0x${string}`,
        abi: wrappedTokenGatewayAbi,
        functionName: "getWETHAddress",
      });
      const tokens = await client.readContract({
        address: prydoxConfig.poolDataProvider as `0x${string}`,
        abi: poolDataProviderAbi,
        functionName: "getReserveTokensAddresses",
        args: [weth],
      });
      return (tokens[0] as `0x${string}`) ?? null;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setLiveSeconds(0);
    const id = window.setInterval(() => setLiveSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(id);
  }, [perSecondRateUsd]);

  useEffect(() => {
    if (!isConnected) {
      setSuppliedBaseline({});
      return;
    }
    setSuppliedBaseline((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const row of suppliedRows) {
        const amount = toNumber(row.amount);
        if (amount > 0 && next[row.symbol] === undefined) {
          next[row.symbol] = amount;
          changed = true;
        }
      }
      for (const key of Object.keys(next)) {
        if (!suppliedRows.some((row) => row.symbol === key)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [isConnected, suppliedRows]);

  useEffect(() => {
    setBorrowLiveSeconds(0);
    const id = window.setInterval(() => setBorrowLiveSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(id);
  }, [totalBorrowed, currentBorrowApyPct]);

  useEffect(() => {
    if (!liquidationErr) return;
    const t = window.setTimeout(() => setLiquidationErr(null), 3500);
    return () => window.clearTimeout(t);
  }, [liquidationErr]);

  async function onLiquidate() {
    setLiquidationErr(null);
    try {
      if (!isAddress(liquidationUserTrimmed)) {
        throw new Error("Enter a valid borrower address");
      }
      if (!(liquidationDebtNum > 0)) {
        throw new Error("Enter a valid USDC debt amount");
      }
      await liquidateUsdcDebt(
        liquidationUserTrimmed as `0x${string}`,
        liquidationDebtAmount.trim(),
        false,
      );
      setLiquidationDebtAmount("");
    } catch (e) {
      setLiquidationErr(e instanceof Error ? e.message : "Liquidation failed");
    }
  }

  return (
    <ProtocolAppShell
      title="Positions"
      subtitle="Your active lending and borrowing exposure across protocol markets."
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("lending")}
            className={`rounded-[9px] border px-4 py-1.5 text-[12px] font-medium transition ${
              activeTab === "lending"
                ? "border-[#1e7a4f] bg-[rgba(15,154,95,0.16)] text-[#c7f3dd]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            Lending Positions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("borrowing")}
            className={`rounded-[9px] border px-4 py-1.5 text-[12px] font-medium transition ${
              activeTab === "borrowing"
                ? "border-[#1e7a4f] bg-[rgba(15,154,95,0.16)] text-[#c7f3dd]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            Borrowing Positions
          </button>
          </div>
        </div>

        {!isConnected ? (
          <p className="text-[14px] text-[var(--muted)]">Connect wallet to see positions.</p>
        ) : isLoading && !data ? (
          <p className="text-[14px] text-[var(--muted)]">Loading positions…</p>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-[14px] text-[var(--fg)]">Unable to load positions right now.</p>
            <p className="text-[12px] text-[var(--muted)]">
              {error instanceof Error ? error.message : "Network error while fetching positions."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center rounded-[8px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] px-2.5 py-1 text-[12px] font-medium text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.28)]"
            >
              Retry
            </button>
          </div>
        ) : (
          activeTab === "lending" ? (
            hasLendingPosition ? (
              <div className="space-y-4">
              <section className="border-b border-[var(--border)] pb-4">
                <h3 className="mb-1 text-[16px] font-semibold text-[var(--fg)]">Lending Overview</h3>
                <p className="mb-3 text-[12px] text-[var(--muted)]">
                  Live lending metrics refresh automatically with pool state.
                </p>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="border-b border-[var(--border)] pb-3">
                    <p className="text-[12px] font-semibold text-[var(--fg)]">Current value</p>
                    <p className="mt-1 text-[24px] font-bold text-[var(--fg)]">
                      {fmtCompact(totalSuppliedUsd)}
                    </p>
                  </div>
                  <div className="border-b border-[var(--border)] pb-3">
                    <p className="text-[12px] font-semibold text-[var(--fg)]">Interest earned</p>
                    <p className="mt-1 text-[24px] font-bold text-[var(--fg)]">
                      {fmtCompact(displayedInterestEarnedUsd)}
                    </p>
                  </div>
                  <div className="border-b border-[var(--border)] pb-3">
                    <p className="text-[12px] font-semibold text-[var(--fg)]">Per second interest</p>
                    <p className="mt-1 text-[24px] font-bold text-[var(--fg)]">
                      {fmtAmount(perSecondRateUsd, 8)} USD/s
                    </p>
                  </div>
                  <div className="border-b border-[var(--border)] pb-3">
                    <p className="text-[12px] font-semibold text-[var(--fg)]">Supply APY</p>
                    <p className="mt-1 text-[24px] font-bold text-[var(--fg)]">
                      {currentApyPct.toFixed(2)}%
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      Net to lenders after {LENDER_PROTOCOL_TAKE_PCT}% protocol share.
                    </p>
                  </div>
                  <div className="border-b border-[var(--border)] pb-3">
                    <p className="text-[12px] font-semibold text-[var(--fg)]">Withdrawal status</p>
                    <p className={`mt-1 text-[24px] font-bold ${withdrawalStatus.tone}`}>
                      {withdrawalStatus.label}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      Based on current USDC liquidity available in the pool.
                    </p>
                  </div>
                </div>
              </section>

              <section className="border-b border-[var(--border)] pb-4">
                <h3 className="mb-3 text-[16px] font-semibold text-[var(--fg)]">Supplied Assets</h3>
                {suppliedRows.length === 0 ? (
                  <p className="text-[13px] text-[var(--muted)]">No supplied assets yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                          <th className="px-2 py-2">Asset</th>
                          <th className="px-2 py-2">Supplied Amount</th>
                          <th className="px-2 py-2">APY</th>
                          <th className="px-2 py-2">Earned (All Time)</th>
                          <th className="px-2 py-2">Earned (30D)</th>
                          <th className="px-2 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliedRows.map((row) => {
                          const amountNum = toNumber(row.amount);
                          const principalAmount = suppliedBaseline[row.symbol] ?? amountNum;
                          const earnedAllTime = Math.max(amountNum - principalAmount, 0);
                          return (
                            <tr key={row.symbol} className="border-b border-white/5">
                              <td className="px-2 py-2">
                                <span className="inline-flex items-center gap-2">
                                  <Image src={row.logo} alt={row.symbol} width={18} height={18} className="rounded-full" />
                                  {row.symbol}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-[var(--fg)]">{fmtAmount(principalAmount)}</td>
                              <td className="px-2 py-2 text-[#8be4b7]">{fmtPct(row.apyPct)}</td>
                              <td className="px-2 py-2 text-[var(--fg)]">
                                {fmtAmount(earnedAllTime)}
                              </td>
                              <td className="px-2 py-2 text-[var(--fg)]">
                                {fmtAmount(Math.max(earnedAllTime / 12, 0))}
                              </td>
                              <td className="px-2 py-2">
                                <Link
                                  href="/lend?tab=withdraw"
                                  className="inline-flex items-center rounded-[8px] border border-[#1d7f50] bg-[#0f9a5f] px-2.5 py-1 text-[11px] font-medium text-white shadow-[inset_0px_2px_3px_0px_rgba(255,255,255,0.2)] transition-colors hover:bg-[#12ad6b]"
                                >
                                  Withdraw
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="border-b border-[var(--border)] pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-[var(--fg)]">Lending Token Contracts</h3>
                </div>
                <p className="mb-3 text-[11px] text-[var(--muted)]">
                  Add pTokens to your wallet to track your supplied balance and accrued interest in real time.
                </p>
                <div className="space-y-2 text-[12px]">
                  {/* pUSDC */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Image src={COINGECKO_USDC_LOGO} alt="pUSDC" width={16} height={16} className="rounded-full" />
                      <span className="text-[var(--fg)]">pUSDC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tight text-[var(--muted)]" title={usdcPtokenAddress ?? "—"}>
                        {shortAddr(usdcPtokenAddress ?? undefined)}
                      </span>
                      {usdcPtokenAddress ? <CopyAddressIconButton text={usdcPtokenAddress} /> : null}
                      {usdcPtokenAddress ? (
                        <button
                          type="button"
                          onClick={() => {
                            void walletClient?.watchAsset({
                              type: "ERC20",
                              options: {
                                address: usdcPtokenAddress,
                                symbol: "pUSDC",
                                decimals: 6,
                                image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
                              },
                            });
                          }}
                          className="inline-flex items-center rounded-[7px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.14)] px-2 py-0.5 text-[10px] font-medium text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.26)]"
                        >
                          + Add to wallet
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {/* pZKLTC */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Image src={COINGECKO_LTC_LOGO} alt="pZKLTC" width={16} height={16} className="rounded-full" />
                      <span className="text-[var(--fg)]">pZKLTC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tight text-[var(--muted)]" title={zkltcPtokenAddress ?? "—"}>
                        {shortAddr(zkltcPtokenAddress ?? undefined)}
                      </span>
                      {zkltcPtokenAddress ? <CopyAddressIconButton text={zkltcPtokenAddress} /> : null}
                      {zkltcPtokenAddress ? (
                        <button
                          type="button"
                          onClick={() => {
                            void walletClient?.watchAsset({
                              type: "ERC20",
                              options: {
                                address: zkltcPtokenAddress,
                                symbol: "pWETH",
                                decimals: 18,
                                image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
                              },
                            });
                          }}
                          className="inline-flex items-center rounded-[7px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.14)] px-2 py-0.5 text-[10px] font-medium text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.26)]"
                        >
                          + Add to wallet
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {/* USDC contract */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Image src={COINGECKO_USDC_LOGO} alt="USDC" width={16} height={16} className="rounded-full" />
                      <span className="text-[var(--fg)]">USDC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tight text-[var(--muted)]" title={prydoxConfig.tokens.USDC}>
                        {shortAddr(prydoxConfig.tokens.USDC)}
                      </span>
                      <CopyAddressIconButton text={prydoxConfig.tokens.USDC} />
                      <button
                        type="button"
                        onClick={() => {
                          void walletClient?.watchAsset({
                            type: "ERC20",
                            options: {
                              address: prydoxConfig.tokens.USDC as `0x${string}`,
                              symbol: "USDC",
                              decimals: 6,
                              image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
                            },
                          });
                        }}
                        className="inline-flex items-center rounded-[7px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.14)] px-2 py-0.5 text-[10px] font-medium text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.26)]"
                      >
                        + Add to wallet
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="pb-2">
                <p className="text-[13px] text-[var(--muted)]">
                  Tip: Your supplied assets are earning yield continuously. You can withdraw anytime based on available
                  pool liquidity.
                </p>
              </section>
              </div>
            ) : (
              <section>
                <p className="text-[14px] text-[var(--fg)]">you have no lend position</p>
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  {zkltcSupplied > 0 && zkltcLendingSupplied <= 0
                    ? "Only failed-borrow collateral is present right now; no active zkLTC lending supply to show."
                    : "Supply USDC or zkLTC to start earning and track your lending metrics here."}
                </p>
                <Link
                  href="/lend"
                  className="mt-3 inline-flex items-center rounded-[8px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] px-2.5 py-1 text-[12px] font-medium text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.28)]"
                >
                  Go to Lend tab
                </Link>
              </section>
            )
          ) : (
            hasBorrowingPosition ? (
              <div className="space-y-4">
              <section className="border-b border-[var(--border)] pb-4 md:pb-5">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-[#bee8d3]">Total Borrowed Value</p>
                    <p className="mt-1 text-[34px] font-semibold tracking-tight text-white">{fmtCompact(totalBorrowedUsd)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#bee8d3]">Accruing interest</p>
                    <p className="mt-1 text-[34px] font-semibold tracking-tight text-white">
                      {fmtCompact(accruingBorrowInterestUsd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#bee8d3]">Borrow APY</p>
                    <p className="mt-1 text-[34px] font-semibold tracking-tight text-white">
                      {currentBorrowApyPct.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#bee8d3]">Health Factor</p>
                    <div className="mt-1 flex items-end gap-2">
                      <p className="text-[34px] font-semibold tracking-tight text-white">{healthFactor ?? "—"}</p>
                      <span className={`pb-2 text-[12px] font-medium ${healthTone}`}>{health}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-4">
                <div className="border-b border-[var(--border)] pb-3">
                  <p className="text-[11px] text-[var(--muted)]">Total Collateral Value</p>
                  <p className="mt-1 text-[24px] font-semibold text-[var(--fg)]">{data?.account?.totalCollateralUsd ?? "—"}</p>
                </div>
                <div className="border-b border-[var(--border)] pb-3">
                  <p className="text-[11px] text-[var(--muted)]">Liquidation Threshold</p>
                  <p className="mt-1 text-[24px] font-semibold text-[var(--fg)]">
                    {data?.account?.liquidationThreshold ?? "—"}
                  </p>
                </div>
              </section>

              <section className="border-b border-[var(--border)] pb-4">
                <h3 className="mb-3 text-[16px] font-semibold text-[var(--fg)]">Borrow Position Overview</h3>
                <div className="grid gap-4 md:grid-cols-[1fr_220px_1fr]">
                  <div className="border-b border-[var(--border)] pb-3 md:border-b-0">
                    <p className="text-[12px] text-[var(--muted)]">Collateral (You lock)</p>
                    <div className="mt-2 inline-flex items-center gap-2 text-[var(--fg)]">
                      <Image src={COINGECKO_LTC_LOGO} alt="zkLTC" width={18} height={18} className="rounded-full" />
                      <span className="font-medium">zkLTC</span>
                    </div>
                    <p className="mt-3 text-[20px] font-semibold text-[var(--fg)]">{data?.zkltc.supplied ?? "0"} zkLTC</p>
                    <p className="text-[12px] text-[var(--muted)]">{data?.account?.totalCollateralUsd ?? "—"}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex h-[170px] w-[170px] items-center justify-center rounded-full border-4 border-[#2ac57a]">
                      <div className="text-center">
                        <p className="text-[11px] text-[var(--muted)]">Health Factor</p>
                        <p className="text-[36px] font-semibold leading-none text-[var(--fg)]">{healthFactor ?? "—"}</p>
                        <p className="mt-1 text-[12px] text-[#8be4b7]">{health}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-[var(--border)] pb-3 md:border-b-0">
                    <p className="text-[12px] text-[var(--muted)]">Borrowed (You get)</p>
                    <div className="mt-2 inline-flex items-center gap-2 text-[var(--fg)]">
                      <Image src={COINGECKO_USDC_LOGO} alt="USDC" width={18} height={18} className="rounded-full" />
                      <span className="font-medium">USDC</span>
                    </div>
                    <p className="mt-3 text-[20px] font-semibold text-[var(--fg)]">{data?.usdc.variableDebt ?? "0"} USDC</p>
                    <p className="text-[12px] text-[var(--muted)]">{fmtCompact(totalBorrowed)}</p>
                  </div>
                </div>
              </section>

              <section className="border-b border-[var(--border)] pb-4">
                <h3 className="mb-3 text-[16px] font-semibold text-[var(--fg)]">Borrowed Assets</h3>
                {borrowedRows.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-[13px] text-[var(--muted)]">
                      {hasLendingOnly
                        ? "you have no borrow position"
                        : "No borrowed assets yet."}
                    </p>
                    {hasLendingOnly ? (
                      <Link
                        href="/borrow"
                        className="inline-flex items-center rounded-[8px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] px-2.5 py-1 text-[12px] font-medium text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.28)]"
                      >
                        Go to Borrow tab
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                          <th className="px-2 py-2">Asset</th>
                          <th className="px-2 py-2">Borrowed Amount</th>
                          <th className="px-2 py-2">APY</th>
                          <th className="px-2 py-2">Interest (30D)</th>
                          <th className="px-2 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {borrowedRows.map((row) => {
                          const amountNum = toNumber(row.amount);
                          return (
                            <tr key={row.symbol} className="border-b border-white/5">
                              <td className="px-2 py-2">
                                <span className="inline-flex items-center gap-2">
                                  <Image src={row.logo} alt={row.symbol} width={18} height={18} className="rounded-full" />
                                  {row.symbol}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-[var(--fg)]">{row.amount} USDC</td>
                              <td className="px-2 py-2 text-[#8be4b7]">{fmtPct(row.apyPct)}</td>
                              <td className="px-2 py-2 text-[var(--fg)]">
                                {fmtCompact(amountNum * (row.apyPct / 100 / 12))}
                              </td>
                              <td className="px-2 py-2">
                                <Link
                                  href="/borrow?tab=repay"
                                  className="inline-flex items-center rounded-md border border-[#1e7a4f] px-2 py-1 text-[11px] text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.16)]"
                                >
                                  Repay
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="border-b border-[var(--border)] pb-4">
                <h3 className="mb-2 text-[16px] font-semibold text-[var(--fg)]">Liquidation Handling</h3>
                <p className="text-[13px] text-[var(--muted)]">
                  Aave-style: positions become liquidatable when health factor drops below <span className="text-[var(--fg)]">1.00</span>.
                  Liquidators can repay part of debt to claim discounted collateral per pool rules.
                </p>
                <p className={`mt-2 text-[13px] font-semibold ${isLiquidatableNow ? "text-[#f39a9a]" : "text-[#8be4b7]"}`}>
                  Liquidation status: {isLiquidatableNow ? "Eligible for liquidation now (HF < 1.00)" : "Not liquidatable (HF >= 1.00)"}
                </p>
                <p className={`mt-2 text-[13px] font-semibold ${healthTone}`}>
                  {health === "Risk"
                    ? "Liquidation risk is high. Add collateral or repay debt immediately."
                    : health === "Warning"
                      ? "Position is near liquidation band. Consider reducing debt."
                      : "Position is currently outside liquidation range."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href="/borrow?tab=repay"
                    className="inline-flex items-center rounded-[8px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] px-2.5 py-1 text-[12px] font-medium text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.28)]"
                  >
                    Repay debt
                  </Link>
                  <Link
                    href="/borrow?tab=borrow"
                    className="inline-flex items-center rounded-[8px] border border-[var(--border)] px-2.5 py-1 text-[12px] font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    Add collateral
                  </Link>
                </div>
              </section>

              <section className="border-b border-[var(--border)] pb-4">
                <h3 className="mb-2 text-[16px] font-semibold text-[var(--fg)]">Liquidation Execution</h3>
                <p className="mb-3 text-[12px] text-[var(--muted)]">
                  Repay a borrower's USDC debt to liquidate an undercollateralized position.
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Borrower address (0x...)"
                    value={liquidationUser}
                    onChange={(e) => setLiquidationUser(e.target.value)}
                    className="rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Debt to cover (USDC)"
                    value={liquidationDebtAmount}
                    onChange={(e) => setLiquidationDebtAmount(e.target.value)}
                    className="rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
                  />
                </div>
                {!isAddress(liquidationUserTrimmed) && liquidationUserTrimmed.length > 0 ? (
                  <p className="mt-2 text-[11px] text-[#f39a9a]">Invalid borrower address.</p>
                ) : null}
                {liquidationErr ? (
                  <p className="mt-2 text-[11px] text-[#f39a9a]">{liquidationErr}</p>
                ) : null}
                {txStatus.state !== "idle" ? (
                  <p
                    className={`mt-2 text-[11px] ${
                      txStatus.state === "success"
                        ? "text-[#8be4b7]"
                        : txStatus.state === "failed"
                          ? "text-[#f39a9a]"
                          : "text-[var(--muted)]"
                    }`}
                  >
                    {txStatus.message}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void onLiquidate()}
                  disabled={!canRunLiquidation}
                  className="mt-3 inline-flex items-center rounded-[8px] border border-[#1d7f50] bg-[#0f9a5f] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#12ad6b] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {liquidationPending ? "Confirm in wallet..." : "Liquidate USDC debt"}
                </button>
              </section>

              <section className="border-b border-[var(--border)] pb-4">
                <h3 className="mb-3 text-[16px] font-semibold text-[var(--fg)]">Token Contracts</h3>
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--muted)]">USDC contract</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tight text-[var(--fg)]" title={prydoxConfig.tokens.USDC}>
                        {shortAddr(prydoxConfig.tokens.USDC)}
                      </span>
                      <CopyAddressIconButton text={prydoxConfig.tokens.USDC} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--muted)]">Debt token</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tight text-[var(--fg)]" title={debtTokenAddress ?? "—"}>
                        {shortAddr(debtTokenAddress ?? undefined)}
                      </span>
                      {debtTokenAddress ? <CopyAddressIconButton text={debtTokenAddress} /> : null}
                    </div>
                  </div>
                </div>
              </section>

              <section className="border-b border-[var(--border)] pb-4">
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="text-[var(--muted)]">Position Health</span>
                  <span className="font-mono-tight text-[var(--fg)]">{healthFactor ?? "—"}</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#2a2d33]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1fcf7a_0%,#1aa564_100%)]"
                    style={{ width: `${healthProgress}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-[#3be093]"
                    style={{ left: `${healthProgress}%` }}
                  />
                  <div
                    className="absolute -top-7 -translate-x-1/2 rounded-[6px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.22)] px-1.5 py-0.5 text-[10px] font-medium text-[#c7f3dd]"
                    style={{ left: `${healthProgress}%` }}
                  >
                    {healthFactor ?? "—"}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 text-[11px] text-[var(--muted)]">
                  <div className="text-left">
                    <p>1.50</p>
                    <p>Safe</p>
                  </div>
                  <div className="text-center">
                    <p>1.10</p>
                    <p>Warning</p>
                  </div>
                  <div className="text-right">
                    <p>1.00</p>
                    <p>Liquidation</p>
                  </div>
                </div>
              </section>

              <section className="pb-2">
                <p className="text-[13px] text-[var(--muted)]">
                  Tip: Maintain a healthy factor above <span className="text-[var(--fg)]">1.10</span> to avoid liquidation.
                  Add more collateral or repay to improve your position.
                </p>
              </section>
              </div>
            ) : (
              <section>
                <p className="text-[14px] text-[var(--fg)]">you have no borrow position</p>
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  {hasLendingOnly
                    ? "You have a lending position but no active debt yet."
                    : "Open a borrow against collateral to see borrowing analytics here."}
                </p>
                <Link
                  href="/borrow"
                  className="mt-3 inline-flex items-center rounded-[8px] border border-[#1e7a4f] bg-[rgba(15,154,95,0.18)] px-2.5 py-1 text-[12px] font-medium text-[#c7f3dd] transition-colors hover:bg-[rgba(15,154,95,0.28)]"
                >
                  Go to Borrow tab
                </Link>
              </section>
            )
          )
        )}
      </div>
    </ProtocolAppShell>
  );
}
