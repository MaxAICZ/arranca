// Exchange rates from pydolarve.org (public API)
export interface Rates {
  bcv: number;
  parallelo: number;
  updated: string;
}

let cache: { data: Rates; timestamp: number } | null = null;
const CACHE_MS = 1000 * 60 * 30; // 30 min

export async function getRates(): Promise<Rates> {
  if (cache && Date.now() - cache.timestamp < CACHE_MS) return cache.data;

  try {
    const res = await fetch("https://pydolarve.org/api/v1/dollar?page=bcv", {
      next: { revalidate: 1800 },
    });
    const json = await res.json();
    const bcv = Number(json?.monitors?.usd?.price) || Number(json?.monitors?.bcv?.price) || 0;
    const data = {
      bcv: bcv || 36.5,
      parallelo: bcv * 1.1,
      updated: new Date().toISOString(),
    };
    cache = { data, timestamp: Date.now() };
    return data;
  } catch {
    return { bcv: 36.5, parallelo: 40, updated: new Date().toISOString() };
  }
}

export function minimumCapital(type: "CA" | "SRL" | "FP" | "PYME"): { usd: number; label: string } {
  switch (type) {
    case "CA": return { usd: 10000, label: "$10,000 USD (recomendado para CA)" };
    case "SRL": return { usd: 5000, label: "$5,000 USD (recomendado para SRL)" };
    case "PYME": return { usd: 500, label: "$500 USD (equivalente a capital mínimo PYME)" };
    case "FP": return { usd: 0, label: "Sin mínimo específico para Firma Personal" };
  }
}
