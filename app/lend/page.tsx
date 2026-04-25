"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { PRYDOX_P, type PrydoxSupplyAsset } from "@/lib/prydox-tokens";
import { formatApyPct } from "@/lib/aave-math";
import { ProtocolAppShell } from "@/components/protocol-app-shell";
import { TransactButton } from "@/components/transact-button";
import { usePoolTransactions } from "@/hooks/use-pool-transactions";
import { usePoolReserves } from "@/hooks/use-pool-reserves";
import { useUserPositions } from "@/hooks/use-user-positions";
import { useWalletBalances } from "@/hooks/use-wallet-balances";

const COINGECKO_USDC_LOGO =
  "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png";
const COINGECKO_LTC_LOGO =
  "https://assets.coingecko.com/coins/images/2/large/litecoin.png";

function fmtBal(
  pending: boolean,
  err: boolean,
  v: string | undefined,
): string {
  if (pending || err) return "—";
  return v ?? "—";
}

function parsePositive(v: string): number {
  const n = Number(v.replaceAll(",", "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function assetLabel(asset: PrydoxSupplyAsset): string {
  return asset === "LTC" ? "zkLTC" : asset;
}

function assetLogo(asset: PrydoxSupplyAsset): string {
  return asset === "USDC" ? COINGECKO_USDC_LOGO : COINGECKO_LTC_LOGO;
}

function matchesReserveSymbol(asset: PrydoxSupplyAsset, reserveSymbol: string) {
  const sym = reserveSymbol.toUpperCase();
  if (asset === "USDC") return sym === "USDC";
  return sym === "LTC" || sym === "ZKLTC";
}

function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col p-1.5 md:p-2">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-[14px] font-semibold text-[var(--fg)]">{title}</h2>
        {badge ? (
          <span className="rounded-full bg-[var(--surface3)] px-2 py-0.5 text-[9px] font-medium text-[var(--accent-bright)]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  right,
  children,
}: {
  label: string;
  right?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex justify-between text-[10px] text-[var(--muted)]">
        <span>{label}</span>
        {right ? (
          <span className="text-[var(--accent-bright)]">{right}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function AssetDropdown({
  value,
  onChange,
  balances,
}: {
  value: PrydoxSupplyAsset;
  onChange: (a: PrydoxSupplyAsset) => void;
  balances: Record<PrydoxSupplyAsset, string>;
}) {
  const opt: PrydoxSupplyAsset[] = ["USDC", "LTC"];
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md bg-[var(--surface3)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--muted)]"
      >
        <Image src={assetLogo(value)} alt={assetLabel(value)} width={16} height={16} className="rounded-full" />
        {assetLabel(value)}
        <span className="text-[9px] text-[var(--muted-2)]">v</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[180px] rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] p-1 shadow-lg">
          {opt.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                onChange(a);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface3)]"
            >
              <span className="inline-flex items-center gap-2 text-[12px] text-[var(--fg)]">
                <Image src={assetLogo(a)} alt={assetLabel(a)} width={16} height={16} className="rounded-full" />
                {assetLabel(a)}
              </span>
              <span className="text-[10px] text-[var(--muted)]">{balances[a]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AmountQuickButtons({
  onPick,
  values,
}: {
  onPick: (v: string) => void;
  values: string[];
}) {
  return (
    <div className="mt-1 flex items-center gap-1">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface2)] px-1.5 py-0.5 text-[9px] text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
        >
          {value === "max" ? "MAX" : value}
        </button>
      ))}
    </div>
  );
}

function LendPageInner() {
  const searchParams = useSearchParams();
  const [depositAsset, setDepositAsset] = useState<PrydoxSupplyAsset>("USDC");
  const [withdrawAsset, setWithdrawAsset] = useState<PrydoxSupplyAsset>("USDC");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [txErr, setTxErr] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<{
    state: "pending" | "success" | "failed";
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"lend" | "withdraw">("lend");

  const {
    data: balances,
    isPending: balPending,
    isError: balErr,
  } = useWalletBalances();
  const { data: positions, isLoading: positionsLoading } = useUserPositions();
  const { supply, withdraw, pending: txPending, txStatus } = usePoolTransactions();
  const { data: reserves } = usePoolReserves();

  const pReceive = PRYDOX_P[depositAsset];
  const pBurn = PRYDOX_P[withdrawAsset];
  /** Wallet: underlying USDC/LTC available to deposit (not pToken). */
  const depositBalance = fmtBal(
    balPending,
    balErr,
    depositAsset === "USDC" ? balances?.usdc : balances?.native,
  );
  /** Supplied position in underlying units — what withdraw burns via pToken. */
  const suppliedBalance =
    positionsLoading || !positions
      ? "—"
      : withdrawAsset === "USDC"
        ? positions.usdc.supplied
        : positions.zkltc.supplied;
  const toInputAmount = (v: string) => v.replaceAll(",", "");
  const depositAmountNum = parsePositive(depositAmount);
  const withdrawAmountNum = parsePositive(withdrawAmount);
  const selectedReserve = reserves?.find((r) =>
    matchesReserveSymbol(depositAsset, r.symbol),
  );
  const selectedSupplyApy = selectedReserve?.supplyApyPct ?? 0;
  const selectedGrossSupplyApy = selectedReserve?.grossSupplyApyPct ?? selectedSupplyApy;
  const protocolTakePct = selectedReserve?.protocolTakePct ?? 20;
  const projectedReceipt = depositAmountNum > 0 ? depositAmountNum.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "0";
  const projectedWithdraw = withdrawAmountNum > 0 ? withdrawAmountNum.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "0";
  const depositIcon = depositAsset === "USDC" ? COINGECKO_USDC_LOGO : COINGECKO_LTC_LOGO;
  const withdrawIcon = withdrawAsset === "USDC" ? COINGECKO_USDC_LOGO : COINGECKO_LTC_LOGO;
  const depositAssetLabel = assetLabel(depositAsset);
  const withdrawAssetLabel = assetLabel(withdrawAsset);
  const depositBalances: Record<PrydoxSupplyAsset, string> = {
    USDC: fmtBal(balPending, balErr, balances?.usdc),
    LTC: fmtBal(balPending, balErr, balances?.native),
  };
  const withdrawBalances: Record<PrydoxSupplyAsset, string> = {
    USDC: positionsLoading || !positions ? "—" : positions.usdc.supplied,
    LTC: positionsLoading || !positions ? "—" : positions.zkltc.supplied,
  };
  const busy = txPending;

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "withdraw") setActiveTab("withdraw");
  }, [searchParams]);
  const depositBalanceNum = parsePositive(depositBalance);
  const suppliedBalanceNum = parsePositive(suppliedBalance);
  const canDeposit =
    !busy &&
    depositAmountNum > 0 &&
    depositBalanceNum > 0 &&
    depositAmountNum <= depositBalanceNum;
  const canWithdraw =
    !busy &&
    withdrawAmountNum > 0 &&
    suppliedBalanceNum > 0 &&
    withdrawAmountNum <= suppliedBalanceNum;
  const hasInsufficientDepositBalance =
    depositAmountNum > 0 &&
    depositBalanceNum > 0 &&
    depositAmountNum > depositBalanceNum;
  const hasInsufficientWithdrawBalance =
    withdrawAmountNum > 0 &&
    suppliedBalanceNum > 0 &&
    withdrawAmountNum > suppliedBalanceNum;

  useEffect(() => {
    if (!txErr) return;
    const t = setTimeout(() => setTxErr(null), 3200);
    return () => clearTimeout(t);
  }, [txErr]);

  useEffect(() => {
    if (txStatus.state === "idle") return;
    setStatusToast({ state: txStatus.state, message: txStatus.message });
    if (txStatus.state === "pending") return;
    const t = setTimeout(() => setStatusToast(null), 3200);
    return () => clearTimeout(t);
  }, [txStatus]);

  async function onDeposit() {
    setTxErr(null);
    try {
      await supply(depositAsset, depositAmount);
      setDepositAmount("");
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  async function onWithdraw() {
    setTxErr(null);
    try {
      await withdraw(withdrawAsset, withdrawAmount, false);
      setWithdrawAmount("");
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  async function onWithdrawAll() {
    setTxErr(null);
    try {
      setWithdrawAmount(toInputAmount(suppliedBalance));
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  function setDepositPreset(value: string) {
    if (value === "max") {
      setDepositAmount(toInputAmount(depositBalance));
      return;
    }
    setDepositAmount(value);
  }

  function setWithdrawPreset(value: string) {
    if (value === "max") {
      void onWithdrawAll();
      return;
    }
    setWithdrawAmount(value);
  }

  return (
    <ProtocolAppShell title="Lend">
      <div className="pb-8">
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-[var(--muted)]">
            Supply assets to mint pTokens and earn yield. zkLTC supplied here provides flash loan liquidity (different from borrow collateral).
          </p>
          <div className="ml-auto inline-flex rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("lend")}
              className={`rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition ${
                activeTab === "lend"
                  ? "bg-[var(--surface3)] text-[var(--fg)]"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              Lend
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("withdraw")}
              className={`rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition ${
                activeTab === "withdraw"
                  ? "bg-[var(--surface3)] text-[var(--fg)]"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>
        {txErr ? (
          <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-[10px] border border-[#5c2b2b] bg-[rgba(42,21,21,0.88)] px-3 py-2 text-[13px] text-[#f8a8a8] shadow-lg backdrop-blur-sm">
            {txErr}
          </div>
        ) : statusToast ? (
          <div
            className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-[10px] px-3 py-2 text-[13px] shadow-lg backdrop-blur-sm ${
              statusToast.state === "success"
                ? "border border-[#2b5c3a] bg-[rgba(21,42,31,0.88)] text-[#a8f8c2]"
                : statusToast.state === "failed"
                  ? "border border-[#5c2b2b] bg-[rgba(42,21,21,0.88)] text-[#f8a8a8]"
                  : "border border-[#2b3d5c] bg-[rgba(22,29,42,0.88)] text-[#a8c3f8]"
            }`}
          >
            {statusToast.message}
          </div>
        ) : null}

        <div className="mt-8 max-w-[760px] space-y-8">
          {activeTab === "lend" ? (
          <Panel title="Deposit" badge="Earn yield">
            <FieldRow
              label="Amount"
            >
              <p className="mb-1.5 text-[10px] leading-relaxed text-[var(--muted-2)]">
                {depositAsset === "LTC"
                  ? "Supply native zkLTC to earn yield and provide flash loan liquidity. Gas fees paid in zkLTC."
                  : "Gas note: approve + supply transactions require native zkLTC for fees."}
              </p>
              <div className="flex max-w-[520px] items-center gap-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5 focus-within:border-[var(--accent)]">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono-tight text-[13px] text-[var(--fg)] outline-none"
                />
                <AssetDropdown value={depositAsset} onChange={setDepositAsset} balances={depositBalances} />
              </div>
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                Wallet balance: {depositBalance} {depositAssetLabel}
              </p>
              {hasInsufficientDepositBalance ? (
                <p className="mt-1 text-[10px] text-[#f8a8a8]">Insufficient balance</p>
              ) : null}
              <AmountQuickButtons onPick={setDepositPreset} values={["10", "50", "100", "max"]} />
            </FieldRow>

            <div className="max-w-[520px] rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] p-3">
              <div className="flex justify-between border-b border-[var(--border)] py-1.5 text-[11px]">
                <span className="text-[var(--muted)]">You receive</span>
                <div className="flex items-center gap-2">
                  <Image src={depositIcon} alt={depositAssetLabel} width={16} height={16} className="rounded-full" />
                  <span className="font-mono-tight font-medium text-[var(--accent-bright)]">
                    {projectedReceipt} {pReceive}
                  </span>
                </div>
              </div>
              <div className="flex justify-between py-1.5 text-[11px]">
                <span className="text-[var(--muted)]">Rate</span>
                <span className="text-[var(--accent-bright)]">
                  {formatApyPct(selectedSupplyApy)} supply APY
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-[11px]">
                <span className="text-[var(--muted)]">Gross APY</span>
                <span className="text-[var(--muted)]">{formatApyPct(selectedGrossSupplyApy)}</span>
              </div>
              <div className="pt-1 text-[10px] text-[var(--muted-2)]">
                Net APY shown to lenders after {protocolTakePct}% protocol share.
              </div>
              {depositAsset === "LTC" ? (
                <div className="mt-3 rounded-[8px] border border-[#1e3d2f] bg-[rgba(15,60,35,0.45)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-[#8be4b7]">Flash Loan Liquidity Provider</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                    zkLTC supplied here funds the protocol&apos;s flash loan pool. When borrowers execute flash loans,
                    a premium fee is charged and distributed back to zkLTC suppliers — supplementing your base supply APY.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--muted-2)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3be093]" />
                    Flash loan fees flow to all active zkLTC suppliers proportionally.
                  </div>
                </div>
              ) : null}
            </div>

            <TransactButton
              label={busy ? "Confirm in wallet…" : `Deposit ${depositAssetLabel}`}
              variant="secondary"
              className="mt-2 max-w-[520px] !py-2 !text-[12px]"
              disabled={!canDeposit}
              onClick={() => void onDeposit()}
            />
          </Panel>
          ) : null}

          {activeTab === "withdraw" ? (
          <Panel title="Withdraw">
            <p className="mb-3 text-[12px] leading-relaxed text-[var(--muted)]">
              Withdraw underlying by burning pTokens.
            </p>

            <FieldRow label="Amount">
              <p className="mb-1.5 text-[10px] leading-relaxed text-[var(--muted-2)]">
                Enter pToken amount to burn. Estimated underlying out is shown
                below; your redeemable balance already reflects accrued
                interest.
              </p>
              <div className="flex max-w-[520px] items-center gap-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono-tight text-[13px] text-[var(--fg)] outline-none"
                />
                <AssetDropdown value={withdrawAsset} onChange={setWithdrawAsset} balances={withdrawBalances} />
              </div>
              <p className="mt-1 text-[10px] text-[var(--accent-bright)]">
                Redeemable (incl. interest): {suppliedBalance} {withdrawAssetLabel}
              </p>
              {hasInsufficientWithdrawBalance ? (
                <p className="mt-1 text-[10px] text-[#f8a8a8]">Insufficient balance</p>
              ) : null}
              <AmountQuickButtons onPick={setWithdrawPreset} values={["10", "50", "100", "max"]} />
            </FieldRow>

            <div className="max-w-[520px] rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] p-3">
              <div className="flex justify-between border-b border-[var(--border)] py-1.5 text-[11px]">
                <span className="text-[var(--muted)]">pToken to burn</span>
                <span className="font-mono-tight text-[var(--accent-bright)]">
                  {withdrawAmountNum > 0 ? projectedWithdraw : "0"} {pBurn}
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-[11px]">
                <span className="text-[var(--muted)]">Estimated you receive</span>
                <div className="flex items-center gap-2">
                  <Image src={withdrawIcon} alt={withdrawAssetLabel} width={16} height={16} className="rounded-full" />
                  <span className="font-mono-tight font-medium text-[var(--fg)]">
                    {projectedWithdraw} {withdrawAssetLabel}
                  </span>
                </div>
              </div>
            </div>

            <TransactButton
              label={busy ? "Confirm in wallet…" : `Withdraw ${pBurn}`}
              variant="secondary"
              className="mt-2 max-w-[520px] !py-2 !text-[12px]"
              disabled={!canWithdraw}
              onClick={() => void onWithdraw()}
            />
          </Panel>
          ) : null}
        </div>
      </div>
    </ProtocolAppShell>
  );
}

export default function LendPage() {
  return (
    <Suspense
      fallback={
        <ProtocolAppShell title="Lend">
          <div className="pb-8">
            <p className="text-[13px] text-[var(--muted)]">Loading…</p>
          </div>
        </ProtocolAppShell>
      }
    >
      <LendPageInner />
    </Suspense>
  );
}
