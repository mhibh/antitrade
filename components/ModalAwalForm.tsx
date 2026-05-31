import { WalletCards } from "lucide-react";
import { formatMoney, formatPercent } from "@/lib/utils";
import type { Currency } from "@/types";

type ModalAwalFormProps = {
  currency: Currency;
  modalAwal: number;
  saldoSekarang: number;
  totalProfit: number;
  totalReturn: number;
  totalWithdrawal: number;
  rate: number;
};

export function ModalAwalForm({
  currency,
  modalAwal,
  rate,
  saldoSekarang,
  totalProfit,
  totalReturn,
  totalWithdrawal
}: ModalAwalFormProps) {
  const profitClass = totalProfit >= 0 ? "text-emerald-100" : "text-rose-100";

  return (
    <section className="purple-panel min-w-0 rounded-[24px] p-4 text-white shadow-glow sm:rounded-[26px] sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/25 text-white">
            <WalletCards className="h-4 w-4" />
          </span>
          <p className="truncate font-semibold">AntiTrade</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-950">
          {formatPercent(totalReturn)}
        </span>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
          Saldo Sekarang
        </p>
        <p className="break-words text-[clamp(1.6rem,8vw,1.875rem)] font-semibold leading-tight tracking-normal">
          {formatMoney(saldoSekarang, currency, rate)}
        </p>
      </div>
      <div className="mt-5 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.18] p-3">
          <span className="text-white/75">Modal Awal</span>
          <span className="break-words text-right font-semibold">{formatMoney(modalAwal, currency, rate)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.18] p-3">
          <span className="text-white/75">Total Profit</span>
          <span className={`break-words text-right font-semibold ${profitClass}`}>
            {formatMoney(totalProfit, currency, rate)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.18] p-3">
          <span className="text-white/75">Total Withdrawal</span>
          <span className="break-words text-right font-semibold text-amber-100">
            {formatMoney(totalWithdrawal, currency, rate)}
          </span>
        </div>
      </div>
    </section>
  );
}
