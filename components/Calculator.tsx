"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator as CalculatorIcon, X } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { Currency } from "@/types";

type CalculatorProps = {
  currency: Currency;
  lastBalance: number;
  onClose?: () => void;
  rate: number;
};

export function Calculator({ currency, lastBalance, onClose, rate }: CalculatorProps) {
  const [capital, setCapital] = useState(lastBalance);
  const [target, setTarget] = useState(2);
  const [maxLoss, setMaxLoss] = useState(1);

  useEffect(() => setCapital(lastBalance), [lastBalance]);

  const result = useMemo(
    () => ({
      targetValue: capital * (target / 100),
      lossValue: capital * (maxLoss / 100)
    }),
    [capital, maxLoss, target]
  );

  return (
    <section className="min-w-0">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="icon-chip grid h-9 w-9 shrink-0 place-items-center rounded-full">
            <CalculatorIcon className="h-4 w-4" />
          </span>
          <h2 className="truncate text-base font-semibold sm:text-lg">Kalkulator Harian</h2>
        </div>
        {onClose ? (
          <button
            aria-label="Tutup modal"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <label className="soft-surface mb-3 block rounded-2xl p-4">
        <span className="mb-2 block text-sm text-slate-500 dark:text-slate-400">Modal hari ini</span>
        <input
          className="w-full min-w-0 bg-transparent text-xl font-semibold outline-none sm:text-2xl"
          min={0}
          onChange={(event) => setCapital(Number(event.target.value))}
          type="number"
          value={capital}
        />
      </label>

      <div className="grid gap-3 min-[360px]:grid-cols-2">
        <label className="soft-surface rounded-2xl p-4">
          <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Target %</span>
          <input
            className="w-full min-w-0 bg-transparent text-lg font-semibold outline-none sm:text-xl"
            min={0}
            onChange={(event) => setTarget(Number(event.target.value))}
            type="number"
            value={target}
          />
        </label>
        <label className="soft-surface rounded-2xl p-4">
          <span className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Max Loss %</span>
          <input
            className="w-full min-w-0 bg-transparent text-lg font-semibold outline-none sm:text-xl"
            min={0}
            onChange={(event) => setMaxLoss(Number(event.target.value))}
            type="number"
            value={maxLoss}
          />
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Target</span>
          <strong className="break-words text-right">{formatMoney(result.targetValue, currency, rate)}</strong>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Stop</span>
          <strong className="break-words text-right">{formatMoney(result.lossValue, currency, rate)}</strong>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Kejar {formatMoney(result.targetValue, currency, rate)}, stop kalau sudah minus{" "}
          {formatMoney(result.lossValue, currency, rate)}.
        </p>
      </div>
    </section>
  );
}
