"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Calculator } from "@/components/Calculator";
import { EquityCurve } from "@/components/EquityCurve";
import { ModalAwalForm } from "@/components/ModalAwalForm";
import { Navbar } from "@/components/Navbar";
import { StatsGrid } from "@/components/StatsGrid";
import { TradeForm } from "@/components/TradeForm";
import { TradeTable } from "@/components/TradeTable";
import { fetchUsdIdrRate } from "@/lib/currency";
import { createClient } from "@/lib/supabase";
import { calculateStats, saldoAkhir, todayIso } from "@/lib/utils";
import type { Currency, Trade, TradeFormValues } from "@/types";

const TRADE_SELECT = "id, user_id, tanggal, saldo_awal, pnl, type, catatan, created_at, updated_at";
const LEGACY_TRADE_SELECT = "id, user_id, tanggal, saldo_awal, pnl, catatan, created_at, updated_at";
const TYPE_MIGRATION_MESSAGE =
  "Kolom type belum ada di database. Jalankan migration add_trade_type.sql dulu untuk memakai fitur Withdrawal.";

function isMissingTypeColumn(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    (message.includes("type") && (message.includes("column") || message.includes("schema cache")))
  );
}

function withDefaultTradeType(trades: Trade[]) {
  return trades.map((trade) => ({ ...trade, type: trade.type ?? "trade" }));
}

export function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [modalAwal, setModalAwal] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currency, setCurrency] = useState<Currency>("IDR");
  const [rate, setRate] = useState(16250);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingModal, setSavingModal] = useState(false);
  const [error, setError] = useState("");

  const supabase = useMemo(() => createClient(), []);
  const stats = useMemo(() => calculateStats(modalAwal, trades), [modalAwal, trades]);
  const lastBalance = useMemo(() => {
    const sortedTrades = [...trades].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    return sortedTrades.length ? saldoAkhir(sortedTrades[sortedTrades.length - 1]) : modalAwal;
  }, [modalAwal, trades]);

  const loadDashboard = useCallback(async () => {
    if (!supabase) {
      setError("Supabase env belum diisi. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);
    const [settingsResult, tradesResultWithType] = await Promise.all([
      supabase.from("settings").select("id, modal_awal").eq("user_id", user.id).maybeSingle(),
      supabase.from("trades").select(TRADE_SELECT).eq("user_id", user.id).order("tanggal", { ascending: true })
    ]);
    const tradesResult = isMissingTypeColumn(tradesResultWithType.error)
      ? await supabase
          .from("trades")
          .select(LEGACY_TRADE_SELECT)
          .eq("user_id", user.id)
          .order("tanggal", { ascending: true })
      : tradesResultWithType;

    if (settingsResult.error) {
      setError("Gagal memuat modal awal.");
    } else if (settingsResult.data) {
      setSettingsId(settingsResult.data.id);
      setModalAwal(settingsResult.data.modal_awal);
    }

    if (tradesResult.error) {
      setError("Gagal memuat catatan trading.");
    } else {
      setTrades(withDefaultTradeType((tradesResult.data ?? []) as Trade[]));
    }

    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    loadDashboard();
    fetchUsdIdrRate().then((result) => {
      setRate(result.rate);
      setUpdatedAt(result.updatedAt);
    });
  }, [loadDashboard]);

  async function toggleCurrency() {
    const result = await fetchUsdIdrRate();
    setRate(result.rate);
    setUpdatedAt(result.updatedAt);
    setCurrency((current) => (current === "IDR" ? "USD" : "IDR"));
  }

  async function handleLogout() {
    await supabase?.auth.signOut();
    router.replace("/login");
  }

  async function handleSaveModal(value: number) {
    if (!supabase || !userId) return;

    setSavingModal(true);
    setError("");

    const payload = { modal_awal: Math.round(value), updated_at: new Date().toISOString() };
    const result = settingsId
      ? await supabase.from("settings").update(payload).eq("id", settingsId).eq("user_id", userId).select("id, modal_awal").single()
      : await supabase
          .from("settings")
          .insert({ ...payload, user_id: userId })
          .select("id, modal_awal")
          .single();

    setSavingModal(false);

    if (result.error) {
      setError("Modal awal gagal disimpan.");
      return;
    }

    setSettingsId(result.data.id);
    setModalAwal(result.data.modal_awal);
  }

  async function handleSaveTrade(values: TradeFormValues) {
    if (!supabase || !userId) return false;

    setError("");
    const payload = {
      tanggal: values.tanggal,
      saldo_awal: Math.round(values.saldo_awal),
      pnl: Math.round(values.pnl),
      type: values.type,
      catatan: values.catatan || null,
      updated_at: new Date().toISOString()
    };

    if (editingTrade) {
      const { data, error: updateError } = await supabase
        .from("trades")
        .update(payload)
        .eq("id", editingTrade.id)
        .eq("user_id", userId)
        .select(TRADE_SELECT)
        .single();

      if (updateError) {
        setError(isMissingTypeColumn(updateError) ? TYPE_MIGRATION_MESSAGE : "Trade gagal diperbarui.");
        return false;
      }

      setTrades((current) => current.map((trade) => (trade.id === editingTrade.id ? (data as Trade) : trade)));
      setEditingTrade(null);
      return true;
    }

    const { data, error: insertError } = await supabase
      .from("trades")
      .insert({ ...payload, user_id: userId })
      .select(TRADE_SELECT)
      .single();

    if (insertError) {
      setError(isMissingTypeColumn(insertError) ? TYPE_MIGRATION_MESSAGE : "Trade gagal ditambahkan.");
      return false;
    }

    setTrades((current) => [...current, data as Trade]);
    return true;
  }

  function handleOpenNewTrade() {
    setEditingTrade(null);
    setTradeModalOpen(true);
  }

  function handleEditTrade(trade: Trade) {
    setEditingTrade(trade);
    setTradeModalOpen(true);
  }

  function handleCloseTradeModal() {
    setTradeModalOpen(false);
    setEditingTrade(null);
  }

  async function handleSaveTradeAndClose(values: TradeFormValues) {
    const saved = await handleSaveTrade(values);
    if (saved) {
      setTradeModalOpen(false);
    }
    return saved;
  }

  async function handleDelete(id: string) {
    if (!supabase || !userId) return;

    setError("");
    const { error: deleteError } = await supabase.from("trades").delete().eq("id", id).eq("user_id", userId);
    if (deleteError) {
      setError("Trade gagal dihapus.");
      return;
    }

    setTrades((current) => current.filter((trade) => trade.id !== id));
  }

  if (loading) {
    return (
      <main className="min-h-screen px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-28 animate-pulse rounded-[24px] bg-slate-200/70 sm:h-16 sm:rounded-3xl dark:bg-white/[0.06]" />
          <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.45fr)]">
            <div className="h-[420px] animate-pulse rounded-[24px] bg-slate-200/70 sm:h-[520px] sm:rounded-[26px] dark:bg-white/[0.06]" />
            <div className="h-[420px] animate-pulse rounded-[24px] bg-slate-200/70 sm:h-[520px] sm:rounded-[26px] dark:bg-white/[0.06]" />
          </div>
        </div>
      </main>
    );
  }

  if (!supabase) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="panel max-w-lg rounded-[26px] p-6 text-center">
          <h1 className="text-xl font-semibold">Konfigurasi Supabase diperlukan</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Navbar
          currency={currency}
          onLogout={handleLogout}
          onOpenTradeModal={handleOpenNewTrade}
          onToggleCurrency={toggleCurrency}
          rate={rate}
          updatedAt={updatedAt}
        />

        {error ? <p className="mt-4 rounded-2xl bg-rose-500/10 p-3 text-sm leading-5 text-rose-700 dark:text-rose-100">{error}</p> : null}

        <div className="mt-4 grid gap-4 sm:mt-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <div className="xl:col-start-1 xl:row-start-1">
            <ModalAwalForm
              currency={currency}
              modalAwal={modalAwal}
              rate={rate}
              saldoSekarang={stats.saldoSekarang}
              totalProfit={stats.totalProfit}
              totalReturn={stats.totalReturn}
              totalWithdrawal={stats.totalWithdrawal}
            />
          </div>

          <div className="xl:col-start-1 xl:row-start-2">
            <StatsGrid
              currency={currency}
              onSaveModal={handleSaveModal}
              rate={rate}
              savingModal={savingModal}
              stats={stats}
            />
          </div>

          <div className="xl:col-start-2 xl:row-start-1">
            <EquityCurve currency={currency} modalAwal={modalAwal} rate={rate} trades={trades} />
          </div>

          <div className="xl:col-start-2 xl:row-start-2">
            <TradeTable
              currency={currency}
              onDelete={handleDelete}
              onEdit={handleEditTrade}
              rate={rate}
              trades={trades}
            />
          </div>
        </div>
      </div>

      {tradeModalOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 px-2 py-2 backdrop-blur-sm sm:place-items-center sm:px-4 sm:py-6 dark:bg-slate-950/75"
          onClick={handleCloseTradeModal}
        >
          <div
            className="panel thin-scrollbar max-h-[94dvh] w-full max-w-5xl overflow-y-auto rounded-[24px] p-3 shadow-2xl sm:max-h-[90vh] sm:rounded-[28px] sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-semibold">Trade Harian</h2>
              </div>
              <button
                aria-label="Tutup modal"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/10"
                onClick={handleCloseTradeModal}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <Calculator currency={currency} lastBalance={lastBalance} rate={rate} />
              <TradeForm
                currency={currency}
                defaultSaldo={lastBalance}
                editingTrade={editingTrade}
                onCancelEdit={handleCloseTradeModal}
                onSave={handleSaveTradeAndClose}
                rate={rate}
                today={todayIso()}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
