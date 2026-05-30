import type { Currency, Trade } from "@/types";

export const idrPerUsdFallback = 16250;

export function formatMoney(value: number, currency: Currency, rate = idrPerUsdFallback) {
  const amount = currency === "USD" ? value / rate : value;

  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0
  }).format(amount);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function dayName(date: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date(date));
}

export function saldoAkhir(trade: Trade) {
  return trade.saldo_awal + trade.pnl;
}

export function countTradeDays(trades: Trade[]) {
  return new Set(trades.map((trade) => trade.tanggal)).size;
}

export function calculateStats(modalAwal: number, trades: Trade[]) {
  const sortedTrades = [...trades].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const tradingRows = sortedTrades.filter((trade) => (trade.type ?? "trade") === "trade");
  const withdrawalRows = sortedTrades.filter((trade) => (trade.type ?? "trade") === "withdrawal");
  const totalPnLTrade = tradingRows.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalWithdrawal = withdrawalRows.reduce((sum, trade) => sum + Math.abs(trade.pnl), 0);
  const saldoSekarang = modalAwal + totalPnLTrade - totalWithdrawal;
  const totalProfit = totalPnLTrade;
  const wins = tradingRows.filter((trade) => trade.pnl > 0);
  const losses = tradingRows.filter((trade) => trade.pnl < 0);
  const bestTrade = tradingRows.length ? Math.max(...tradingRows.map((trade) => trade.pnl)) : 0;
  const worstLoss = losses.length ? Math.min(...losses.map((trade) => trade.pnl)) : 0;

  return {
    modalAwal,
    saldoSekarang,
    totalReturn: modalAwal ? ((saldoSekarang - modalAwal) / modalAwal) * 100 : 0,
    winRate: tradingRows.length ? (wins.length / tradingRows.length) * 100 : 0,
    totalProfit,
    totalWithdrawal,
    avgProfit: tradingRows.length ? totalProfit / tradingRows.length : 0,
    avgWin: wins.length ? wins.reduce((sum, trade) => sum + trade.pnl, 0) / wins.length : 0,
    avgLoss: losses.length ? losses.reduce((sum, trade) => sum + trade.pnl, 0) / losses.length : 0,
    bestTrade,
    worstTrade: worstLoss,
    totalHari: countTradeDays(sortedTrades)
  };
}

export function buildEquityData(modalAwal: number, trades: Trade[]) {
  let pnlKumulatif = 0;
  const tradeRows = [...trades]
    .filter((trade) => (trade.type ?? "trade") === "trade")
    .sort((a, b) => {
      const aCreated = a.created_at ?? a.updated_at ?? a.id;
      const bCreated = b.created_at ?? b.updated_at ?? b.id;
      const createdCompare = aCreated.localeCompare(bCreated);

      if (createdCompare !== 0) return createdCompare;

      return a.tanggal.localeCompare(b.tanggal);
    });
  const points = tradeRows.map((trade) => {
    pnlKumulatif += trade.pnl;

    return {
      tanggal: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(
        new Date(trade.tanggal)
      ),
      pnlKumulatif,
      pnl: trade.pnl,
      modalAwal
    };
  });

  return [
    {
      tanggal: "Awal",
      pnlKumulatif: 0,
      pnl: 0,
      modalAwal
    },
    ...points
  ];
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
