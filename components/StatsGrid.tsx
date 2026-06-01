"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BadgePercent,
  Save,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatMoney, formatMoneyInputValue, formatPercent, parseMoneyInputValue } from "@/lib/utils";
import type { Currency } from "@/types";

type StatsGridProps = {
  currency: Currency;
  rate: number;
  stats: {
    modalAwal: number;
    saldoSekarang: number;
    totalReturn: number;
    winRate: number;
    totalProfit: number;
    totalWithdrawal: number;
    avgProfit: number;
    avgWin: number;
    avgLoss: number;
    bestTrade: number;
    worstTrade: number;
    totalHari: number;
  };
  savingModal?: boolean;
  onSaveModal: (value: number) => void;
};

export function StatsGrid({ currency, onSaveModal, rate, savingModal, stats }: StatsGridProps) {
  const [modalValue, setModalValue] = useState(stats.modalAwal);
  const [modalInput, setModalInput] = useState(formatMoneyInputValue(stats.modalAwal, currency, rate));

  useEffect(() => {
    setModalValue(stats.modalAwal);
    setModalInput(formatMoneyInputValue(stats.modalAwal, currency, rate));
  }, [currency, rate, stats.modalAwal]);

  const cards = [
    {
      label: "Total Return",
      value: formatPercent(stats.totalReturn),
      icon: BadgePercent,
      valueClass: "text-[clamp(1.45rem,7vw,2.125rem)] sm:text-[2rem]",
    },
    {
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      icon: TrendingUp,
    },
    {
      label: "Saldo Sekarang",
      value: formatMoney(stats.saldoSekarang, currency, rate),
      icon: Target,
    },
    {
      label: "Profit Bersih",
      value: formatMoney(stats.totalProfit, currency, rate),
      icon: TrendingUp,
    },
    {
      label: "Total Withdrawal",
      value: formatMoney(stats.totalWithdrawal, currency, rate),
      icon: TrendingDown,
    },
    {
      label: "Rata Win",
      value: formatMoney(stats.avgWin, currency, rate),
      icon: Activity,
      helper: `Best: ${formatMoney(stats.bestTrade, currency, rate)}`,
      helperClass: "text-emerald-600/80 dark:text-emerald-300/80",
    },
    {
      label: "Rata Loss",
      value: formatMoney(stats.avgLoss, currency, rate),
      icon: TrendingDown,
      helper: `Worst: ${formatMoney(stats.worstTrade, currency, rate)}`,
      helperClass: "text-rose-600/80 dark:text-rose-300/80",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 sm:gap-3">
      <form
        className="panel min-w-0 rounded-[18px] p-3 sm:rounded-[22px] sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSaveModal(modalValue);
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="min-w-0 text-[11px] leading-4 text-slate-500 sm:text-xs dark:text-slate-400">
            Modal Awal
          </span>
          <span className="icon-chip grid h-7 w-7 shrink-0 place-items-center rounded-full sm:h-8 sm:w-8">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </div>
        <input
          className="soft-surface w-full min-w-0 rounded-xl px-2.5 py-2 text-sm font-semibold outline-none transition focus:border-violet-500/70 dark:focus:border-violet-300/60"
          min={0}
          onChange={(event) => {
            setModalInput(event.target.value);
            setModalValue(parseMoneyInputValue(event.target.value, currency, rate));
          }}
          step={currency === "USD" ? "0.01" : "1"}
          type="number"
          value={modalInput}
        />
        <button
          className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={savingModal}
          type="submit"
        >
          <Save className="h-3 w-3" />
          {savingModal ? "Menyimpan..." : "Simpan Modal Awal"}
        </button>
      </form>
      {cards.map((card) => (
        <div
          className="panel min-w-0 rounded-[18px] p-3 sm:rounded-[22px] sm:p-4"
          key={card.label}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <span className="min-w-0 text-[11px] leading-4 text-slate-500 sm:text-xs dark:text-slate-400">
              {card.label}
            </span>
            <span className="icon-chip grid h-7 w-7 shrink-0 place-items-center rounded-full sm:h-8 sm:w-8">
              <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p
            className={`break-words font-semibold leading-tight ${
              card.valueClass ?? "text-[clamp(0.875rem,3.8vw,1.0625rem)] sm:text-lg"
            }`}
          >
            {card.value}
          </p>
          {"helper" in card && card.helper ? (
            <p className={`mt-1 text-[11px] font-semibold leading-4 sm:text-xs ${card.helperClass}`}>
              {card.helper}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}
