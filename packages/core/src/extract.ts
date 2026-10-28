import type { Site } from "@derecherche/data";
import type {
  DocumentLike,
  ElementLike,
  QueryContext,
  QueryResult,
} from "./types.js";
import { normalizeQuery } from "./url.js";

const GENERIC_URL_PARAMS = [
  "q",
  "query",
  "wd",
  "kw",
  "p",
  "text",
  "search_query",
] as const;

const GENERIC_SELECTORS = [
  'input[type="search"]',
  'input[name="q"]',
  'input[name="query"]',
  'input[name="wd"]',
  'input[name="keyword"]',
  'textarea[name="q"]',
] as const;

export interface ExtractOptions {
  genericFallback?: boolean;
  preferSelection?: boolean;
  minSelectionLength?: number;
}

function makeResult(
  query: string,
  source: QueryResult["source"],
  confidence: number,
  adapterId?: string
): QueryResult | null {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;
  return { query: normalized, source, confidence, adapterId };
}

function readElementValue(element: ElementLike | null): string | null {
  if (!element) return null;
  if (typeof element.value === "string" && element.value.trim()) {
    return element.value;
  }
  const attribute = element.getAttribute("value");
  if (attribute && attribute.trim()) return attribute;
  const text = element.textContent;
  if (text && text.trim()) return text;
  return null;
}

function hostMatches(host: string, pattern: string): boolean {
  const normalized = pattern.toLowerCase();
  const target = host.toLowerCase();
  if (normalized.startsWith("*.")) {
    const base = normalized.slice(2);
    return target === base || target.endsWith(`.${base}`);
  }
  return target === normalized;
}

function hashParams(url: URL): URLSearchParams {
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : "";
  const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : hash;
  return new URLSearchParams(query);
}

function readParam(url: URL, name: string): string | null {
  const direct = url.searchParams.get(name);
  if (direct?.trim()) return direct;
  const hashed = hashParams(url).get(name);
  return hashed?.trim() ? hashed : null;
}

export function siteMatchScore(url: URL, site: Site): number | null {
  const hostMatch = site.hosts.find((pattern) => hostMatches(url.hostname, pattern));
  if (!hostMatch) return null;
  if (site.pathPattern && !new RegExp(site.pathPattern).test(url.pathname)) {
    return null;
  }
  if (site.paramMatches) {
    for (const [key, expected] of Object.entries(site.paramMatches)) {
      if (readParam(url, key) !== expected) return null;
    }
  }

  let score = site.priority ?? 0;
  if (site.pathPattern) score += 10;
  score += Object.keys(site.paramMatches ?? {}).length * 5;
  if (!hostMatch.startsWith("*.")) score += 1;
  return score;
}

export function matchSite(url: URL, sites: readonly Site[]): Site | undefined {
  let best: Site | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const site of sites) {
    const score = siteMatchScore(url, site);
    if (score !== null && score > bestScore) {
      best = site;
      bestScore = score;
    }
  }
  return best;
}

export function extractFromUrl(url: URL, site?: Site): QueryResult | null {
  const params = site?.urlParams?.length ? site.urlParams : GENERIC_URL_PARAMS;
  for (const name of params) {
    const value = readParam(url, name);
    if (value) {
      return makeResult(value, "url", site ? 0.95 : 0.8, site?.id);
    }
  }
  return null;
}

export function extractFromDocument(
  document: DocumentLike,
  site?: Site,
  documentKind: "dom" | "html" = "dom"
): QueryResult | null {
  const selectors = site?.selectors?.query?.length
    ? site.selectors.query
    : GENERIC_SELECTORS;

  for (const selector of selectors) {
    const value = readElementValue(document.querySelector(selector));
    if (value) {
      return makeResult(
        value,
        "searchbox",
        site ? (documentKind === "html" ? 0.85 : 0.9) : 0.75,
        site?.id
      );
    }
  }
  return null;
}

export function extractFromSelection(
  selection: string | undefined,
  minLength = 2
): QueryResult | null {
  if (!selection) return null;
  const normalized = normalizeQuery(selection);
  if (normalized.length < minLength) return null;
  return makeResult(normalized, "selection", 0.8);
}

export function extractFromClipboard(clipboard: string | undefined): QueryResult | null {
  if (!clipboard) return null;
  return makeResult(clipboard, "clipboard", 0.7);
}

export function extractQuery(
  context: QueryContext,
  sites: readonly Site[],
  options: ExtractOptions = {}
): QueryResult | null {
  const {
    genericFallback = true,
    preferSelection = false,
    minSelectionLength = 2,
  } = options;

  const url = new URL(context.url);

  if (preferSelection) {
    const selected = extractFromSelection(context.selection, minSelectionLength);
    if (selected) return selected;
  }

  const site = matchSite(url, sites);
  const fromSiteUrl = extractFromUrl(url, site);
  if (fromSiteUrl) return fromSiteUrl;

  if (genericFallback && site) {
    const fromGenericUrl = extractFromUrl(url);
    if (fromGenericUrl) return fromGenericUrl;
  }

  if (context.document) {
    const fromDocument = extractFromDocument(
      context.document,
      site,
      context.documentKind ?? "dom"
    );
    if (fromDocument) return fromDocument;
  }

  if (!preferSelection) {
    const selected = extractFromSelection(context.selection, minSelectionLength);
    if (selected) return selected;
  }

  return extractFromClipboard(context.clipboard);
}
