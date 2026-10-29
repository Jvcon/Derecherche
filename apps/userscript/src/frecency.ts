import type { FrecencyEntry } from "@derecherche/core";

const STORAGE_KEY = "derecherche:frecency";
const MAX_ENTRIES = 200;

declare const GM_getValue:
  | (<T>(key: string, fallback: T) => T)
  | undefined;
declare const GM_setValue:
  | ((key: string, value: unknown) => void)
  | undefined;

function readRaw(): string | null {
  if (
    typeof GM_getValue === "function" &&
    typeof GM_setValue === "function"
  ) {
    const value = GM_getValue<string | null>(STORAGE_KEY, null);
    return typeof value === "string" ? value : null;
  }
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string): void {
  if (
    typeof GM_getValue === "function" &&
    typeof GM_setValue === "function"
  ) {
    GM_setValue(STORAGE_KEY, value);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Search still works when storage is blocked.
  }
}

function isEntry(value: unknown): value is FrecencyEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<FrecencyEntry>;
  return (
    typeof entry.engineId === "string" &&
    typeof entry.count === "number" &&
    entry.count > 0 &&
    typeof entry.lastUsedAt === "number"
  );
}

export function getFrecency(): FrecencyEntry[] {
  const raw = readRaw();
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(isEntry).slice(0, MAX_ENTRIES);
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
  writeRaw(JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}
