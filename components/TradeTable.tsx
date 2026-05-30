"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Edit3, FileText, Trash2, X } from "lucide-react";
import {
  countTradeDays,
  dayName,
  formatMoney,
  formatPercent,
  saldoAkhir,
} from "@/lib/utils";
import type { Currency, Trade } from "@/types";

const PAGE_SIZE = 7;

function statusClass(isWithdrawal: boolean, isWin: boolean, isLoss: boolean) {
  if (isWithdrawal) return "status-withdrawal";
  if (isWin) return "status-win";
  if (isLoss) return "status-loss";
  return "status-neutral";
}

function valueToneClass(tone: "neutral" | "win" | "loss") {
  if (tone === "win") return "text-emerald-600 dark:text-emerald-300";
  if (tone === "loss") return "text-rose-600 dark:text-rose-300";
  return "text-slate-600 dark:text-slate-300";
}

type TradeTableProps = {
  currency: Currency;
  rate: number;
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
};

export function TradeTable({
  currency,
  onDelete,
  onEdit,
  rate,
  trades,
}: TradeTableProps) {
  const [page, setPage] = useState(0);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const totalDays = countTradeDays(trades);
  const sortedTrades = [...trades].sort((a, b) => {
    const dateCompare = b.tanggal.localeCompare(a.tanggal);

    if (dateCompare !== 0) return dateCompare;

    const aCreated = a.created_at ?? a.updated_at ?? a.id;
    const bCreated = b.created_at ?? b.updated_at ?? b.id;

    return bCreated.localeCompare(aCreated);
  });
  const totalPages = Math.ceil(sortedTrades.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleTrades = sortedTrades.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const selectedPercent = selectedTrade?.saldo_awal
    ? (selectedTrade.pnl / selectedTrade.saldo_awal) * 100
    : 0;
  const selectedIsWithdrawal = selectedTrade
    ? (selectedTrade.type ?? "trade") === "withdrawal"
    : false;
  const selectedIsWin = selectedTrade ? !selectedIsWithdrawal && selectedTrade.pnl > 0 : false;
  const selectedIsLoss = selectedTrade ? !selectedIsWithdrawal && selectedTrade.pnl < 0 : false;

  useEffect(() => {
    setPage(0);
  }, [trades.length]);

  function handleTradeKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    trade: Trade,
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    setSelectedTrade(trade);
  }

  function handleEdit(trade: Trade) {
    setSelectedTrade(null);
    onEdit(trade);
  }

  function handleDelete(id: string) {
    setSelectedTrade(null);
    onDelete(id);
  }

  return (
    <section className="panel rounded-[24px] p-3 sm:rounded-[26px] sm:p-4">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="font-semibold">Catatan Trading</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Catatan trading terbaru</p>
        </div>
        <span className="status-win shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
          {totalDays} hari
        </span>
      </div>

      {sortedTrades.length === 0 ? (
        <div className="soft-surface rounded-[20px] border-dashed p-5 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
          Belum ada catatan trading.
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {visibleTrades.map((trade) => {
          const percent = trade.saldo_awal
            ? (trade.pnl / trade.saldo_awal) * 100
            : 0;
          const isWithdrawal = (trade.type ?? "trade") === "withdrawal";
          const isWin = !isWithdrawal && trade.pnl > 0;
          const isLoss = !isWithdrawal && trade.pnl < 0;

          return (
            <article
              aria-label={`Lihat detail trade ${trade.tanggal}`}
              className="interactive-surface cursor-pointer rounded-[20px] p-3 transition focus:outline-none focus:ring-2 focus:ring-violet-400/70"
              key={trade.id}
              onClick={() => setSelectedTrade(trade)}
              onKeyDown={(event) => handleTradeKeyDown(event, trade)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{trade.tanggal}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {dayName(trade.tanggal)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(isWithdrawal, isWin, isLoss)}`}
                >
                  {isWithdrawal ? "Withdraw" : isWin ? "Win" : isLoss ? "Loss" : "Flat"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Saldo</p>
                  <p className="mt-1 break-words">
                    {formatMoney(trade.saldo_awal, currency, rate)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">PnL</p>
                  <p
                    className={`mt-1 break-words ${valueToneClass(isWin ? "win" : isLoss || isWithdrawal ? "loss" : "neutral")}`}
                  >
                    {formatMoney(trade.pnl, currency, rate)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">% Return</p>
                  <p
                    className={`mt-1 ${valueToneClass(isWin ? "win" : isLoss ? "loss" : "neutral")}`}
                  >
                    {formatPercent(percent)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Saldo Akhir</p>
                  <p className="mt-1 break-words">
                    {formatMoney(saldoAkhir(trade), currency, rate)}
                  </p>
                </div>
              </div>

            </article>
          );
        })}
      </div>

      <div className="thin-scrollbar hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Tanggal</th>
              <th className="px-3 py-2 font-medium">Hari</th>
              <th className="px-3 py-2 font-medium">Modal</th>
              <th className="px-3 py-2 font-medium">PnL</th>
              <th className="px-3 py-2 font-medium">% Return</th>
              <th className="px-3 py-2 font-medium">Saldo Akhir</th>
              <th className="px-3 py-2 font-medium">Hasil</th>
            </tr>
          </thead>
          <tbody>
            {visibleTrades.map((trade) => {
              const percent = trade.saldo_awal
                ? (trade.pnl / trade.saldo_awal) * 100
                : 0;
              const isWithdrawal = (trade.type ?? "trade") === "withdrawal";
              const isWin = !isWithdrawal && trade.pnl > 0;
              const isLoss = !isWithdrawal && trade.pnl < 0;

              return (
                <tr
                  aria-label={`Lihat detail trade ${trade.tanggal}`}
                  className="interactive-surface cursor-pointer transition"
                  key={trade.id}
                  onClick={() => setSelectedTrade(trade)}
                  onKeyDown={(event) => handleTradeKeyDown(event, trade)}
                  role="button"
                  tabIndex={0}
                >
                  <td className="rounded-l-2xl px-3 py-3">{trade.tanggal}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-300">
                    {dayName(trade.tanggal)}
                  </td>
                  <td className="px-3 py-3">
                    {formatMoney(trade.saldo_awal, currency, rate)}
                  </td>
                  <td
                    className={
                      isWin
                        ? "px-3 py-3 text-emerald-600 dark:text-emerald-300"
                        : isLoss || isWithdrawal
                          ? "px-3 py-3 text-rose-600 dark:text-rose-300"
                          : "px-3 py-3 text-slate-600 dark:text-slate-300"
                    }
                  >
                    {formatMoney(trade.pnl, currency, rate)}
                  </td>
                  <td
                    className={
                      isWin
                        ? "px-3 py-3 text-emerald-600 dark:text-emerald-300"
                        : isLoss
                          ? "px-3 py-3 text-rose-600 dark:text-rose-300"
                          : "px-3 py-3 text-slate-600 dark:text-slate-300"
                    }
                  >
                    {formatPercent(percent)}
                  </td>
                  <td className="px-3 py-3">
                    {formatMoney(saldoAkhir(trade), currency, rate)}
                  </td>
                  <td className="rounded-r-2xl px-3 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(isWithdrawal, isWin, isLoss)}`}
                    >
                      {isWithdrawal ? "Withdraw" : isWin ? "Win" : isLoss ? "Loss" : "Flat"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Halaman {currentPage + 1} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-full bg-slate-100 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10"
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(value - 1, 0))}
              type="button"
            >
              Sebelumnya
            </button>
            <button
              className="rounded-full bg-violet-600 px-3 py-2 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage >= totalPages - 1}
              onClick={() =>
                setPage((value) => Math.min(value + 1, totalPages - 1))
              }
              type="button"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      ) : null}

      {selectedTrade ? (
        <div
          aria-labelledby="trade-detail-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-6 backdrop-blur-sm"
          onClick={() => setSelectedTrade(null)}
          role="dialog"
        >
          <div
            className="panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] p-4 shadow-glow sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dayName(selectedTrade.tanggal)}
                </p>
                <h3
                  className="break-words text-xl font-semibold"
                  id="trade-detail-title"
                >
                  {selectedIsWithdrawal ? "Detail Withdrawal" : "Detail Trade"}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedTrade.tanggal}
                </p>
              </div>
              <button
                aria-label="Tutup detail trade"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                onClick={() => setSelectedTrade(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  statusClass(selectedIsWithdrawal, selectedIsWin, selectedIsLoss)
                }`}
              >
                {selectedIsWithdrawal
                  ? "Withdrawal"
                  : selectedIsWin
                    ? "Win"
                    : selectedIsLoss
                      ? "Loss"
                      : "Flat"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedIsWin
                    ? "status-win"
                    : selectedIsLoss
                      ? "status-loss"
                      : "status-neutral"
                }`}
              >
                {formatPercent(selectedPercent)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="Modal"
                value={formatMoney(selectedTrade.saldo_awal, currency, rate)}
              />
              <DetailItem
                label="PnL"
                tone={
                  selectedIsWin
                    ? "win"
                    : selectedIsLoss || selectedIsWithdrawal
                      ? "loss"
                      : "neutral"
                }
                value={formatMoney(selectedTrade.pnl, currency, rate)}
              />
              <DetailItem
                label="% Return"
                tone={
                  selectedIsWin ? "win" : selectedIsLoss ? "loss" : "neutral"
                }
                value={formatPercent(selectedPercent)}
              />
              <DetailItem
                label="Saldo Akhir"
                value={formatMoney(saldoAkhir(selectedTrade), currency, rate)}
              />
            </div>

            {!selectedIsWithdrawal ? (
              <div className="soft-surface mt-3 rounded-2xl p-4">
                <p className="mb-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <FileText className="h-3.5 w-3.5" />
                  Catatan
                </p>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {selectedTrade.catatan?.trim() || "Belum ada catatan."}
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="flex min-h-10 items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                onClick={() => handleDelete(selectedTrade.id)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </button>
              <button
                className="flex min-h-10 items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
                onClick={() => handleEdit(selectedTrade)}
                type="button"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DetailItem({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "win" | "loss";
  value: string;
}) {
  return (
    <div className="soft-surface min-w-0 rounded-2xl p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 break-words text-base font-semibold ${
          valueToneClass(tone)
        }`}
      >
        {value}
      </p>
    </div>
  );
}
