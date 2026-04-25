"use client";

import { useEffect, useState } from "react";
import { ProtocolAppShell } from "@/components/protocol-app-shell";
import { TransactButton } from "@/components/transact-button";
import { usePoolTransactions } from "@/hooks/use-pool-transactions";

export default function FlashPage() {
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [txErr, setTxErr] = useState<string | null>(null);
  const { flashLoanSimple, pending, txStatus } = usePoolTransactions();
  const [statusToast, setStatusToast] = useState<{
    state: "pending" | "success" | "failed";
    message: string;
  } | null>(null);

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

  async function onFlash() {
    setTxErr(null);
    try {
      await flashLoanSimple(receiver.trim(), amount);
      setAmount("");
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  return (
    <ProtocolAppShell
      title="Flash Loans"
      subtitle="Access liquidity without collateral in a single atomic transaction."
    >
      <div className="pb-8">
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

        <div className="mt-8 p-1 md:p-2">
          <h2 className="text-[15px] font-semibold text-[var(--accent-bright)]">
            Overview
          </h2>
          <p className="mt-2 text-[13px] leading-[1.7] text-[var(--muted)]">
            Liquidity is shared with ordinary borrows. Your receiver contract
            must implement the pool callback and return funds plus premium
            within the execution.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="p-1 md:p-2">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">
                Execute
              </h2>
              <span className="rounded-full bg-[var(--surface3)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--fg)]">
                Advanced
              </span>
            </div>
            <div className="mb-4">
              <div className="mb-2 text-[11px] text-[var(--muted)]">Amount</div>
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-1 py-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono-tight text-[14px] text-[var(--fg)] outline-none"
                />
                <span className="rounded-md bg-[#1a1f2e] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                  USDC
                </span>
              </div>
            </div>
            <div className="mb-4">
              <div className="mb-2 text-[11px] text-[var(--muted)]">
                Receiver contract
              </div>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full border-b border-[var(--border)] bg-transparent px-1 py-2 font-mono-tight text-[13px] text-[var(--fg)] outline-none"
              />
            </div>
            <div className="py-2">
              <div className="flex justify-between border-b border-[var(--border)] py-2 text-[12px]">
                <span className="text-[var(--muted)]">Premium</span>
                <span className="font-mono-tight text-[var(--fg)]">Per pool</span>
              </div>
              <div className="flex justify-between py-2 text-[12px]">
                <span className="text-[var(--muted)]">Total to return</span>
                <span className="font-mono-tight text-[var(--accent-bright)]">
                  Principal + premium
                </span>
              </div>
            </div>
            <TransactButton
              label={pending ? "Confirm in wallet…" : "Execute flash loan"}
              variant="primary"
              className="mt-4"
              disabled={pending}
              onClick={() => void onFlash()}
            />
          </div>

          <div className="p-1 md:p-2">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">
                Receiver
              </h2>
              <span className="rounded-full bg-[#2d1a00] px-2.5 py-0.5 text-[10px] font-medium text-[var(--warning)]">
                Developer
              </span>
            </div>
            <pre className="overflow-x-auto font-mono-tight text-[11px] leading-[1.85] text-[var(--fg)]">
{`// Prydox pool — match deployed receiver interface
interface IFlashLoanReceiver {
  function executeOperation(
    address[] assets,
    uint256[] amounts,
    uint256[] premiums,
    address initiator,
    bytes params
  ) external returns (bool);
}`}
            </pre>
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--muted)]">
              Implement the callback your deployment expects; approve the pool to
              pull repayment before the call ends.
            </p>
          </div>
        </div>
      </div>
    </ProtocolAppShell>
  );
}
