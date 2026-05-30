"use client";

import { useState } from "react";
import { ArrowRight, Mail, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase";

type LoginFormProps = {
  mode: "login" | "register";
};

export function LoginForm({ mode }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase env belum diisi. Untuk preview UI, buka dashboard utama.");
      setLoading(false);
      return;
    }

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm text-slate-600 dark:text-slate-300">Email</span>
        <span className="soft-surface flex items-center gap-3 rounded-2xl px-4">
          <Mail className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300" />
          <input
            className="h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-500"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            required
            type="email"
            value={email}
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-slate-600 dark:text-slate-300">Password</span>
        <span className="soft-surface flex items-center gap-3 rounded-2xl px-4">
          <LockKeyhole className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300" />
          <input
            className="h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-500"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 6 karakter"
            required
            type="password"
            value={password}
          />
        </span>
      </label>
      {message ? <p className="break-words rounded-2xl bg-violet-500/10 p-3 text-sm leading-6 text-violet-700 dark:text-violet-100">{message}</p> : null}
      <button
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 font-semibold leading-5 text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-100"
        disabled={loading}
      >
        {loading ? "Memproses..." : mode === "login" ? "Login" : "Register"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
