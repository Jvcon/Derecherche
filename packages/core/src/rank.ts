import type { Engine } from "@derecherche/data";
import { applySettings, type ResolvedEngine } from "./settings.js";
import type { Settings } from "./types.js";
import { normalizeQuery } from "./url.js";

export interface FrecencyEntry {
  engineId: string;
  count: number;
  lastUsedAt: number;
}

export interface RankContext {
  query?: string;
  categoryId?: string;
  categoryPath?: readonly string[];
  scopeIds?: readonly string[];
  host?: string;
  now?: number;
}

export interface RankOptions {
  recommendedLimit?: number;
  maxPerProvider?: number;
  frecency?: readonly FrecencyEntry[];
}

export interface RankedEngines {
  stable: ResolvedEngine[];
  recommended: ResolvedEngine[];
}

export interface RankedListItem extends ResolvedEngine {
  recommended: boolean;
}

export interface RankedList {
  items: RankedListItem[];
  recommendedIds: string[];
}

const RECOMMENDATION_LIMIT = 3;
const DEFAULT_MAX_PER_PROVIDER = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function frecencyScore(entry: FrecencyEntry | undefined, now: number): number {
  if (!entry || entry.count <= 0) return 0;
  const ageDays = Math.max(0, (now - entry.lastUsedAt) / DAY_MS);
  const recency = clamp(20 - ageDays, 0, 20);
  return Math.min(120, entry.count * 8 + recency);
}

function triggerScore(engine: Engine, query: string): number {
  if (!query) return 0;
  const haystack = query.toLowerCase();
  const candidates = [
    ...(engine.triggers ?? []),
    ...(engine.tags ?? []),
    engine.name,
  ]
    .map((value) => value.toLowerCase())
    .filter(Boolean);

  let score = 0;
  for (const candidate of candidates) {
    if (candidate.length < 2) continue;
    if (haystack.includes(candidate)) {
      score += candidate === engine.name.toLowerCase() ? 8 : 12;
    }
  }
  return Math.min(60, score);
}

function categoryScore(engine: Engine, context: RankContext): number {
  if (!context.categoryId) return 0;
  if (engine.category === context.categoryId) return 30;
  if (context.categoryPath?.includes(engine.category)) return 20;
  if (context.scopeIds?.includes(engine.category)) return 20;
  return 0;
}

export function recommendationScore(
  engine: Engine,
  context: RankContext,
  frecency?: FrecencyEntry
): number {
  const now = context.now ?? Date.now();
  const query = normalizeQuery(context.query ?? "");
  let score = 0;
  score += frecencyScore(frecency, now);
  score += triggerScore(engine, query);
  score += categoryScore(engine, context);
  if (engine.status === "broken") score -= 100;
  if (engine.status === "deprecated") score -= 20;
  return score;
}

function stableSort(engines: readonly ResolvedEngine[]): ResolvedEngine[] {
  return engines
    .map((engine, index) => ({ engine, index }))
    .sort((a, b) => {
      const aPinned = a.engine.pinned ? 1 : 0;
      const bPinned = b.engine.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      const aOrder = a.engine.order ?? a.index;
      const bOrder = b.engine.order ?? b.index;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.index - b.index;
    })
    .map(({ engine }) => engine);
}

function activeResolved(
  engines: readonly Engine[],
  settings: Settings
): ResolvedEngine[] {
  return stableSort(
    applySettings(engines, settings).filter((engine) => engine.status === "active")
  );
}

function frecencyMap(
  entries: readonly FrecencyEntry[] | undefined
): Map<string, FrecencyEntry> {
  return new Map(
    (entries ?? [])
      .filter((entry) => entry.engineId && entry.count > 0)
      .map((entry) => [entry.engineId, entry])
  );
}

export function rankEngines(
  engines: readonly Engine[],
  settings: Settings,
  context: RankContext = {},
  options: RankOptions = {}
): RankedEngines {
  const stable = activeResolved(engines, settings);
  const stableIndex = new Map(stable.map((engine, index) => [engine.id, index]));
  const frecency = frecencyMap(options.frecency);
  const limit = Math.max(0, options.recommendedLimit ?? RECOMMENDATION_LIMIT);

  const recommended = stable
    .filter((engine) => !engine.pinned)
    .map((engine) => ({
      engine,
      score: recommendationScore(engine, context, frecency.get(engine.id)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return (stableIndex.get(a.engine.id) ?? 0) - (stableIndex.get(b.engine.id) ?? 0);
    })
    .slice(0, limit)
    .map(({ engine }) => engine);

  return { stable, recommended };
}

/**
 * Merge recommendations and the base list into one deduplicated list.
 *
 * Head order:
 *   1. pinned engines
 *   2. top recommendation engines (non-pinned, max per provider)
 *   3. base-list engines not already in the head, in stable order
 */
export function buildRankedList(
  candidatePool: readonly Engine[],
  basePool: readonly Engine[],
  settings: Settings,
  context: RankContext = {},
  options: RankOptions = {}
): RankedList {
  const candidates = activeResolved(candidatePool, settings);
  const base = activeResolved(basePool, settings);
  const frecency = frecencyMap(options.frecency);

  const pinned = candidates.filter((engine) => engine.pinned);
  const nonPinned = candidates.filter((engine) => !engine.pinned);
  const limit = Math.max(0, options.recommendedLimit ?? RECOMMENDATION_LIMIT);
  const maxPerProvider = Math.max(
    1,
    options.maxPerProvider ?? DEFAULT_MAX_PER_PROVIDER
  );

  const scored = nonPinned
    .map((engine, index) => ({
      engine,
      index,
      score: recommendationScore(engine, context, frecency.get(engine.id)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.index - b.index;
    });

  const picked: ResolvedEngine[] = [];
  const providerCounts = new Map<string, number>();

  for (const entry of scored) {
    if (picked.length >= limit) break;
    const count = providerCounts.get(entry.engine.providerId) ?? 0;
    if (count >= maxPerProvider) continue;
    picked.push(entry.engine);
    providerCounts.set(entry.engine.providerId, count + 1);
  }

  const headIds = new Set(
    [...pinned, ...picked].map((engine) => engine.id)
  );
  const rest = base.filter((engine) => !headIds.has(engine.id));

  return {
    items: [
      ...pinned.map((engine) => ({ ...engine, recommended: false })),
      ...picked.map((engine) => ({ ...engine, recommended: true })),
      ...rest.map((engine) => ({ ...engine, recommended: false })),
    ],
    recommendedIds: picked.map((engine) => engine.id),
  };
}
