"use client";

import { useEffect, useState } from "react";
import { LogOut, Moon, Plus, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { Currency } from "@/types";

type NavbarProps = {
  currency: Currency;
  rate: number;
  updatedAt: Date;
  onOpenTradeModal: () => void;
  onToggleCurrency: () => void;
  onLogout: () => void;
};

export function Navbar({ currency, onLogout, onOpenTradeModal, onToggleCurrency, rate, updatedAt }: NavbarProps) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = resolvedTheme ?? theme ?? "dark";
  const isDark = currentTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <header className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/90 px-3 py-3 text-slate-950 shadow-xl shadow-slate-200/70 backdrop-blur sm:rounded-3xl sm:px-4 lg:flex-row lg:items-center lg:justify-between dark:border-white/10 dark:bg-[#16213e]/80 dark:text-slate-50 dark:shadow-black/20">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold sm:text-xl">RekapTrading</h1>
            <p className="mt-0.5 text-xs leading-5 text-slate-400 sm:mt-1">
              1 USD = Rp {Math.round(rate).toLocaleString("id-ID")} · {updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap sm:justify-end">
        <button
          className="h-10 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
          onClick={onToggleCurrency}
          type="button"
        >
          {currency === "IDR" ? "Rp" : "USD"}
        </button>
        <button
          aria-label="Toggle theme"
          aria-pressed={mounted ? isDark : undefined}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10"
          onClick={toggleTheme}
          type="button"
        >
          {mounted && isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <button
          className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-violet-400/30 bg-violet-600 px-3 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-500 sm:px-4"
          onClick={onOpenTradeModal}
          type="button"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="truncate">Tambah Trade</span>
        </button>
        <button
          aria-label="Logout"
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/10"
          onClick={onLogout}
          type="button"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
