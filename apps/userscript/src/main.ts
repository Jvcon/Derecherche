import {
  createDefaultSettings,
  extractQuery,
  matchSite,
} from "@derecherche/core";
import catalog from "@derecherche/data";
import {
  mountInlineBar,
  openPalette,
  type InlineBarHandle,
} from "@derecherche/ui";
import { getFrecency, recordEngineUse } from "./frecency";

const data = catalog;
const GLOBAL_KEY = "__derechercheUserscript";
const NAVIGATE_EVENT = "derecherche:navigate";

let inlineBar: InlineBarHandle | null = null;
let currentSiteId: string | undefined;
let mutationTimer: number | undefined;

function debugEnabled(): boolean {
  try {
    return new URL(window.location.href).searchParams.has("derecherche-debug");
  } catch {
    return false;
  }
}

function pageResult() {
  try {
    return extractQuery(
      {
        url: window.location.href,
        document,
        documentKind: "dom",
      },
      data.sites
    );
  } catch {
    return null;
  }
}

function siteForCurrentPage() {
  try {
    return matchSite(new URL(window.location.href), data.sites);
  } catch {
    return undefined;
  }
}

function openPaletteFor(query: string, categoryId?: string): void {
  openPalette({
    catalog: data,
    query,
    sourceLabel: "inline-bar",
    categoryId,
    focusCategory: Boolean(categoryId),
    frecency: getFrecency(),
    onEngineOpened: recordEngineUse,
  });
}

function destroyInlineBar(): void {
  inlineBar?.destroy();
  inlineBar = null;
  currentSiteId = undefined;
}

function syncInlineBar(): void {
  const result = pageResult();
  const site = siteForCurrentPage();

  if (!result || !site) {
    destroyInlineBar();
    return;
  }

  const next = {
    query: result.query,
    url: window.location.href,
    categoryId: site.defaultCategory,
  };

  if (inlineBar && currentSiteId === site.id) {
    inlineBar.update(next);
    return;
  }

  inlineBar?.destroy();
  currentSiteId = site.id;
  inlineBar = mountInlineBar({
    catalog: data,
    sites: data.sites,
    settings: createDefaultSettings(data.catalogVersion),
    ...next,
    frecency: getFrecency(),
    debug: debugEnabled(),
    onEngineOpened: recordEngineUse,
    onMore: (context) => openPaletteFor(context.query, context.categoryId),
  });

  if (!inlineBar) currentSiteId = undefined;
}

function notifyNavigation(): void {
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

function installNavigationHooks(): void {
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method] as (...args: unknown[]) => void;
    (history as unknown as Record<string, unknown>)[method] = function (
      this: History,
      ...args: unknown[]
    ): void {
      original.apply(this, args);
      notifyNavigation();
    };
  }

  window.addEventListener("popstate", notifyNavigation);
  window.addEventListener("hashchange", notifyNavigation);
  window.addEventListener(NAVIGATE_EVENT, syncInlineBar);

  const observer = new MutationObserver(() => {
    window.clearTimeout(mutationTimer);
    mutationTimer = window.setTimeout(() => {
      if (!document.getElementById("derecherche-inline-bar")) {
        syncInlineBar();
      }
    }, 150);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function start(): void {
  const scope = window as unknown as Record<string, unknown>;
  if (scope[GLOBAL_KEY]) return;
  scope[GLOBAL_KEY] = true;

  installNavigationHooks();
  syncInlineBar();

  if (debugEnabled()) {
    console.info("[Derecherche] userscript active", {
      site: currentSiteId,
      inlineBar: Boolean(inlineBar),
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
