import type { FrecencyEntry } from "@derecherche/core";

const STORAGE_KEY = "derecherche-playground-frecency";
const MAX_ENTRIES = 200;

export function getFrecency(): FrecencyEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (entry): entry is FrecencyEntry =>
          typeof entry === "object" &&
          entry !== null &&
          typeof entry.engineId === "string" &&
          typeof entry.count === "number" &&
          typeof entry.lastUsedAt === "number"
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function recordEngineUse(engineId: string): void {
  const now = Date.now();
  const entries = getFrecency();
  const existing = entries.find((entry) => entry.engineId === engineId);
  if (existing) {
    existing.count += 1;
    existing.lastUsedAt = now;
  } else {
    entries.unshift({ engineId, count: 1, lastUsedAt: now });
  }
  entries.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}
