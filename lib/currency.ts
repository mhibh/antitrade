import { idrPerUsdFallback } from "@/lib/utils";

type RateResult = {
  rate: number;
  updatedAt: Date;
};

let cachedRate: RateResult | null = null;
const cacheKey = "rekaptrading:usd-idr-rate";
const cacheMaxAge = 10 * 60 * 1000;

function readStoredRate(): RateResult | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { rate?: number; updatedAt?: string };
    if (!parsed.rate || !parsed.updatedAt) return null;

    const updatedAt = new Date(parsed.updatedAt);
    if (Number.isNaN(updatedAt.getTime()) || Date.now() - updatedAt.getTime() >= cacheMaxAge) {
      return null;
    }

    return { rate: parsed.rate, updatedAt };
  } catch {
    return null;
  }
}

function storeRate(result: RateResult) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    cacheKey,
    JSON.stringify({ rate: result.rate, updatedAt: result.updatedAt.toISOString() })
  );
}

export async function fetchUsdIdrRate(): Promise<RateResult> {
  if (cachedRate && Date.now() - cachedRate.updatedAt.getTime() < cacheMaxAge) {
    return cachedRate;
  }

  const storedRate = readStoredRate();
  if (storedRate) {
    cachedRate = storedRate;
    return cachedRate;
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!response.ok) throw new Error("Rate request failed");

    const data = (await response.json()) as { rates?: { IDR?: number } };
    const rate = data.rates?.IDR;
    if (!rate) throw new Error("Missing IDR rate");

    cachedRate = { rate, updatedAt: new Date() };
    storeRate(cachedRate);
    return cachedRate;
  } catch {
    cachedRate = { rate: idrPerUsdFallback, updatedAt: new Date() };
    storeRate(cachedRate);
    return cachedRate;
  }
}
