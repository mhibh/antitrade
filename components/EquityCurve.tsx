"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { BarChart3 } from "lucide-react";
import { buildEquityData, formatMoney } from "@/lib/utils";
import type { Currency, Trade } from "@/types";

type EquityCurveProps = {
  currency: Currency;
  modalAwal: number;
  rate: number;
  trades: Trade[];
};

type EquityPoint = {
  tanggal: string;
  tanggalIso: string | null;
  pnlKumulatif: number;
  pnlDisplay: number;
  pnl: number;
};

type PeriodFilter = "1d" | "3d" | "1m" | "7t" | "30t" | "all";

const periodFilters: { label: string; value: PeriodFilter }[] = [
  { label: "1D", value: "1d" },
  { label: "3D", value: "3d" },
  { label: "1M", value: "1m" },
  { label: "7T", value: "7t" },
  { label: "30T", value: "30t" },
  { label: "Semua", value: "all" },
];

function formatSignedMoney(value: number, currency: Currency, rate: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";

  return `${sign}${formatMoney(Math.abs(value), currency, rate)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getCalendarThreshold(days: number) {
  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - (days - 1));

  return threshold;
}

function filterEquityData(data: EquityPoint[], period: PeriodFilter) {
  if (period === "all") return data;

  const tradePoints = data.filter((item) => item.tanggalIso);

  if (period === "7t") return tradePoints.slice(-7);
  if (period === "30t") return tradePoints.slice(-30);

  const threshold =
    period === "1d"
      ? getCalendarThreshold(1)
      : period === "3d"
        ? getCalendarThreshold(3)
        : getCalendarThreshold(30);

  return tradePoints.filter((item) => {
    if (!item.tanggalIso) return false;

    return parseLocalDate(item.tanggalIso) >= threshold;
  });
}

function EquityTooltip({
  active,
  currency,
  payload,
  rate,
}: TooltipProps<ValueType, NameType> & {
  currency: Currency;
  rate: number;
}) {
  const point = payload?.[0]?.payload as EquityPoint | undefined;

  if (!active || !point) return null;

  const pnlTone =
    point.pnlKumulatif > 0
      ? "text-emerald-500"
      : point.pnlKumulatif < 0
        ? "text-rose-500"
        : "text-slate-500 dark:text-slate-300";
  const tradeTone =
    point.pnl > 0
      ? "text-emerald-500"
      : point.pnl < 0
        ? "text-rose-500"
        : "text-slate-500 dark:text-slate-300";

  return (
    <div className="rounded-2xl border border-[var(--chart-tooltip-border)] bg-[var(--chart-tooltip-bg)] px-3 py-2 text-sm text-[var(--chart-tooltip-text)] shadow-lg">
      <p className={pnlTone}>
        PnL Kumulatif: {formatSignedMoney(point.pnlKumulatif, currency, rate)}
      </p>
      <p className={tradeTone}>
        Trade ini: {formatSignedMoney(point.pnl, currency, rate)}
      </p>
    </div>
  );
}

export function EquityCurve({
  currency,
  modalAwal,
  rate,
  trades,
}: EquityCurveProps) {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const allData = buildEquityData(modalAwal, trades).map((item) => ({
    ...item,
    pnlDisplay: currency === "USD" ? item.pnlKumulatif / rate : item.pnlKumulatif,
  }));
  const data = filterEquityData(allData, period);
  const pnlValues = data.map((item) => item.pnlDisplay);
  const minPnl = Math.min(0, ...pnlValues);
  const maxPnl = Math.max(0, ...pnlValues);
  const yDomain: [number, number] = minPnl === maxPnl ? [-1, 1] : [minPnl, maxPnl];
  const zeroOffset = clamp((yDomain[1] / (yDomain[1] - yDomain[0])) * 100, 0, 100);
  const zeroStop = `${zeroOffset}%`;

  return (
    <section className="panel flex h-full flex-col rounded-[24px] p-3 sm:rounded-[26px] sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <span className="icon-chip grid h-9 w-9 shrink-0 place-items-center rounded-full">
            <BarChart3 className="h-4 w-4" />
          </span>
          <p className="font-semibold">Perjalanan Tradingmu</p>
        </div>
        <div className="soft-surface flex max-w-full flex-wrap justify-end gap-1 rounded-[18px] p-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 sm:rounded-full">
          {periodFilters.map((filter) => (
            <button
              aria-pressed={period === filter.value}
              className={`min-h-8 min-w-10 rounded-full px-3 transition ${
                period === filter.value
                  ? "bg-violet-600 text-white hover:bg-violet-500 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-100"
                  : "hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
              key={filter.value}
              onClick={() => setPeriod(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[260px] flex-1 overflow-hidden xl:min-h-0">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={data}
            margin={{ bottom: 4, left: -8, right: 8, top: 8 }}
          >
            <defs>
              <linearGradient id="equityPositiveFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
                <stop offset={zeroStop} stopColor="rgba(16, 185, 129, 0.15)" />
                <stop offset={zeroStop} stopColor="rgba(16, 185, 129, 0)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
              </linearGradient>
              <linearGradient id="equityNegativeFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0)" />
                <stop offset={zeroStop} stopColor="rgba(239, 68, 68, 0)" />
                <stop offset={zeroStop} stopColor="rgba(239, 68, 68, 0.15)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.15)" />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="4 4"
            />
            <XAxis
              axisLine={false}
              dataKey="tanggal"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              domain={yDomain}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(value: number) =>
                formatSignedMoney(
                  currency === "USD" ? value * rate : value,
                  currency,
                  rate,
                )
              }
              tickLine={false}
              width={82}
            />
            <ReferenceLine
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeOpacity={0.65}
              strokeWidth={1}
              y={0}
            />
            <Tooltip
              content={(props) => (
                <EquityTooltip {...props} currency={currency} rate={rate} />
              )}
            />
            <Area
              baseValue={0}
              dataKey="pnlDisplay"
              dot={false}
              fill="url(#equityNegativeFill)"
              stroke="transparent"
              type="monotone"
            />
            <Area
              baseValue={0}
              dataKey="pnlDisplay"
              dot={({ cx, cy, payload }) => (
                <circle
                  cx={cx}
                  cy={cy}
                  fill={(payload as { pnl: number }).pnl < 0 ? "#ef4444" : "#10b981"}
                  r={4}
                  stroke="#0f0f1a"
                  strokeWidth={2}
                />
              )}
              fill="url(#equityPositiveFill)"
              stroke="#a855f7"
              strokeWidth={3}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
