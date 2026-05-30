import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-3 py-6 sm:px-4 sm:py-10">
      <div className="panel w-full max-w-md rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <div className="mb-6 sm:mb-8">
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">RekapTrading</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Masuk ke dashboard</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Pantau modal, PnL, dan disiplin trading harianmu.
          </p>
        </div>
        <LoginForm mode="login" />
      </div>
    </main>
  );
}
