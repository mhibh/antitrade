"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { formatMoney, formatMoneyInputValue, parseMoneyInputValue } from "@/lib/utils";
import type { Currency, Trade, TradeFormValues, TradeType } from "@/types";

type PnlInputMode = "pnl" | "ending-balance";

type TradeFormProps = {
  currency: Currency;
  defaultSaldo: number;
  editingTrade: Trade | null;
  rate: number;
  today: string;
  onCancelEdit: () => void;
  onSave: (values: TradeFormValues) => void | boolean | Promise<void | boolean>;
};

export function TradeForm({
  currency,
  defaultSaldo,
  editingTrade,
  onCancelEdit,
  onSave,
  rate,
  today
}: TradeFormProps) {
  const [tanggal, setTanggal] = useState(today);
  const [saldo, setSaldo] = useState(defaultSaldo);
  const [type, setType] = useState<TradeType>("trade");
  const [pnlInputMode, setPnlInputMode] = useState<PnlInputMode>("pnl");
  const [pnl, setPnl] = useState("");
  const [saldoAkhirBroker, setSaldoAkhirBroker] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [saldoInput, setSaldoInput] = useState(formatMoneyInputValue(defaultSaldo, currency, rate));
  const [pnlInput, setPnlInput] = useState("");
  const [saldoAkhirBrokerInput, setSaldoAkhirBrokerInput] = useState("");
  const [withdrawalAmountInput, setWithdrawalAmountInput] = useState("");
  const [catatan, setCatatan] = useState("");
  const moneyInputStep = currency === "USD" ? "0.01" : "1";
  const endingBalanceValue = saldoAkhirBroker === "" ? saldo : Number(saldoAkhirBroker);
  const withdrawalValue = Math.abs(Number(withdrawalAmount || 0));
  const effectivePnl =
    type === "withdrawal"
      ? -withdrawalValue
      : pnlInputMode === "pnl"
        ? Number(pnl || 0)
        : endingBalanceValue - saldo;
  const estimatedEndingBalance = saldo + effectivePnl;
  const formattedPnl = `${effectivePnl > 0 ? "+" : ""}${formatMoney(effectivePnl, currency, rate)}`;
  const isWithdrawal = type === "withdrawal";

  useEffect(() => {
    if (editingTrade) {
      const editingType = editingTrade.type ?? "trade";
      setTanggal(editingTrade.tanggal);
      setSaldo(editingTrade.saldo_awal);
      setSaldoInput(formatMoneyInputValue(editingTrade.saldo_awal, currency, rate));
      setType(editingType);
      setPnlInputMode("pnl");
      setPnl(String(editingTrade.pnl));
      setPnlInput(formatMoneyInputValue(editingTrade.pnl, currency, rate));
      setSaldoAkhirBroker(String(editingTrade.saldo_awal + editingTrade.pnl));
      setSaldoAkhirBrokerInput(formatMoneyInputValue(editingTrade.saldo_awal + editingTrade.pnl, currency, rate));
      setWithdrawalAmount(editingType === "withdrawal" ? String(Math.abs(editingTrade.pnl)) : "");
      setWithdrawalAmountInput(
        editingType === "withdrawal" ? formatMoneyInputValue(Math.abs(editingTrade.pnl), currency, rate) : ""
      );
      setCatatan(editingTrade.catatan ?? "");
      return;
    }

    setTanggal(today);
    setSaldo(defaultSaldo);
    setSaldoInput(formatMoneyInputValue(defaultSaldo, currency, rate));
    setType("trade");
    setPnlInputMode("pnl");
    setPnl("");
    setPnlInput("");
    setSaldoAkhirBroker("");
    setSaldoAkhirBrokerInput("");
    setWithdrawalAmount("");
    setWithdrawalAmountInput("");
    setCatatan("");
  }, [defaultSaldo, editingTrade, today]);

  useEffect(() => {
    setSaldoInput(formatMoneyInputValue(saldo, currency, rate));
    setPnlInput(formatMoneyInputValue(pnl, currency, rate));
    setSaldoAkhirBrokerInput(formatMoneyInputValue(saldoAkhirBroker, currency, rate));
    setWithdrawalAmountInput(formatMoneyInputValue(withdrawalAmount, currency, rate));
  }, [currency, rate]);

  function handleTypeChange(nextType: TradeType) {
    if (nextType === type) return;

    if (nextType === "withdrawal") {
      const nextWithdrawalAmount = effectivePnl ? Math.abs(effectivePnl) : "";
      setWithdrawalAmount(String(nextWithdrawalAmount));
      setWithdrawalAmountInput(formatMoneyInputValue(nextWithdrawalAmount, currency, rate));
    } else {
      setPnl(String(effectivePnl));
      setPnlInput(formatMoneyInputValue(effectivePnl, currency, rate));
    }

    setType(nextType);
  }

  function handlePnlInputModeChange(mode: PnlInputMode) {
    if (mode === pnlInputMode) return;

    if (mode === "ending-balance") {
      if (editingTrade) {
        const endingBalance = saldo + effectivePnl;
        setSaldoAkhirBroker(String(endingBalance));
        setSaldoAkhirBrokerInput(formatMoneyInputValue(endingBalance, currency, rate));
      } else {
        setSaldoAkhirBroker("");
        setSaldoAkhirBrokerInput("");
      }
    } else {
      setPnl(String(effectivePnl));
      setPnlInput(formatMoneyInputValue(effectivePnl, currency, rate));
    }

    setPnlInputMode(mode);
  }

  function parseOptionalMoneyInput(value: string) {
    const amount = Number(value);
    if (value === "" || !Number.isFinite(amount)) return "";

    return String(parseMoneyInputValue(value, currency, rate));
  }

  function removeDecimalSeparators(value: string) {
    return value.replace(/[.,]/g, "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await onSave({
      tanggal,
      saldo_awal: saldo,
      pnl: effectivePnl,
      type,
      catatan: isWithdrawal ? "" : catatan
    });
    if (!editingTrade && result !== false) {
      setPnl("");
      setPnlInput("");
      setSaldoAkhirBroker("");
      setSaldoAkhirBrokerInput("");
      setWithdrawalAmount("");
      setWithdrawalAmountInput("");
      setCatatan("");
      setType("trade");
    }
  }

  return (
    <section className="min-w-0">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold">
          {editingTrade
            ? isWithdrawal
              ? "Edit Withdrawal"
              : "Edit Trade"
            : isWithdrawal
              ? "Tambah Withdrawal"
              : "Tambah Catatan"}
        </h2>
        <button
          aria-label="Tutup modal"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/10"
          onClick={onCancelEdit}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="soft-surface mb-2 flex overflow-hidden rounded-full p-1 text-xs text-slate-600 dark:text-slate-300">
          <button
            className={`min-h-8 flex-1 rounded-full px-3 font-medium transition ${
              type === "trade" ? "bg-violet-600 text-white hover:bg-violet-500 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-100" : "hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
            onClick={() => handleTypeChange("trade")}
            type="button"
          >
            Trade
          </button>
          <button
            className={`min-h-8 flex-1 rounded-full px-3 font-medium transition ${
              type === "withdrawal" ? "bg-amber-400 text-amber-950" : "hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
            onClick={() => handleTypeChange("withdrawal")}
            type="button"
          >
            Withdrawal
          </button>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Tanggal</span>
          <input
            className="soft-surface h-11 w-full min-w-0 rounded-2xl px-4 outline-none transition focus:border-violet-500/70 dark:focus:border-violet-300/60"
            onChange={(event) => setTanggal(event.target.value)}
            required
            type="date"
            value={tanggal}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Saldo Hari Ini</span>
          <input
            className="soft-surface h-11 w-full min-w-0 rounded-2xl px-4 outline-none transition focus:border-violet-500/70 dark:focus:border-violet-300/60"
            min={0}
            onChange={(event) => {
              setSaldoInput(event.target.value);
              setSaldo(parseMoneyInputValue(event.target.value, currency, rate));
            }}
            required
            step={moneyInputStep}
            type="number"
            value={saldoInput}
          />
        </label>
        {isWithdrawal ? (
          <label className="block">
            <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Jumlah Penarikan</span>
            <input
              className="soft-surface h-11 w-full min-w-0 rounded-2xl px-4 outline-none transition focus:border-violet-500/70 dark:focus:border-violet-300/60"
              min={currency === "USD" ? 0.01 : 1}
              onChange={(event) => {
                setWithdrawalAmountInput(event.target.value);
                setWithdrawalAmount(parseOptionalMoneyInput(event.target.value));
              }}
              placeholder="Contoh: 500000"
              required
              step={moneyInputStep}
              type="number"
              value={withdrawalAmountInput}
            />
            <span className="mt-2 block text-sm font-medium text-rose-600 dark:text-rose-300">PnL: {formattedPnl}</span>
          </label>
        ) : (
          <div className="block">
            <div className="soft-surface mb-2 flex overflow-hidden rounded-full p-1 text-xs text-slate-600 dark:text-slate-300">
              <button
                className={`min-h-8 flex-1 rounded-full px-3 font-medium transition ${
                  pnlInputMode === "pnl" ? "bg-violet-600 text-white hover:bg-violet-500 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-100" : "hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
                onClick={() => handlePnlInputModeChange("pnl")}
                type="button"
              >
                Input PnL
              </button>
              <button
                className={`min-h-8 flex-1 rounded-full px-3 font-medium transition ${
                  pnlInputMode === "ending-balance" ? "bg-violet-600 text-white hover:bg-violet-500 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-100" : "hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
                onClick={() => handlePnlInputModeChange("ending-balance")}
                type="button"
              >
                Input Saldo Akhir
              </button>
            </div>
            {pnlInputMode === "pnl" ? (
              <label className="block">
                <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Profit / Loss</span>
                <input
                  className="soft-surface h-11 w-full min-w-0 rounded-2xl px-4 outline-none transition focus:border-violet-500/70 dark:focus:border-violet-300/60"
                  onChange={(event) => {
                    setPnlInput(event.target.value);
                    setPnl(parseOptionalMoneyInput(event.target.value));
                  }}
                  placeholder="-50000 atau 150000"
                  required
                  step={moneyInputStep}
                  type="number"
                  value={pnlInput}
                />
              </label>
            ) : (
              <label className="block">
                <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Saldo Akhir di Broker</span>
                <input
                  className="soft-surface h-11 w-full min-w-0 rounded-2xl px-4 outline-none transition focus:border-violet-500/70 dark:focus:border-violet-300/60"
                  min={0}
                  onChange={(event) => {
                    const nextValue = removeDecimalSeparators(event.target.value);
                    setSaldoAkhirBrokerInput(nextValue);
                    setSaldoAkhirBroker(parseOptionalMoneyInput(nextValue));
                  }}
                  placeholder="Saldo akhir setelah trade"
                  required
                  step={moneyInputStep}
                  type="text"
                  inputMode="numeric"
                  value={saldoAkhirBrokerInput}
                />
                <span className="mt-2 block text-sm font-medium text-slate-600 dark:text-slate-300">P&amp;L: {formattedPnl}</span>
              </label>
            )}
          </div>
        )}
        {!isWithdrawal ? (
          <label className="block">
            <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Catatan</span>
            <textarea
              className="soft-surface min-h-20 w-full resize-none rounded-2xl px-4 py-3 outline-none transition focus:border-violet-500/70 dark:focus:border-violet-300/60"
              onChange={(event) => setCatatan(event.target.value)}
              placeholder="Setup, emosi, atau evaluasi singkat"
              value={catatan}
            />
          </label>
        ) : null}
        <div className="soft-surface break-words rounded-2xl p-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Estimasi saldo akhir: {formatMoney(estimatedEndingBalance, currency, rate)}
        </div>
        <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-3 font-semibold leading-5 text-white transition hover:bg-violet-500 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-100" type="submit">
          <Save className="h-4 w-4" />
          Simpan
        </button>
      </form>
    </section>
  );
}
