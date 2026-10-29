import type { Catalog, Engine, Site } from "@derecherche/data";
import {
  buildRankedList,
  buildTargetUrl,
  createDefaultSettings,
  matchSite,
  resolveMount,
  type FrecencyEntry,
  type MountInsert,
  type MountResolution,
  type Settings,
} from "@derecherche/core";
import { DEFAULT_COMMON_ENGINE_IDS } from "./defaults.js";
import type { PaletteOpenMode } from "./palette.js";
import { createShadowHost } from "./shadow.js";

export interface InlineBarContext {
  query: string;
  categoryId?: string;
  site?: Site;
}

export interface InlineBarOptions {
  catalog: Catalog;
  sites: readonly Site[];
  settings?: Settings;
  query?: string;
  url?: string;
  categoryId?: string;
  commonEngineIds?: readonly string[];
  frecency?: readonly FrecencyEntry[];
  limit?: number;
  document?: Document;
  debug?: boolean;
  onResolve?: (resolution: MountResolution<Element>) => void;
  onMore?: (context: InlineBarContext) => void;
  onOpen?: (engine: Engine, url: string, mode: PaletteOpenMode) => void;
  onEngineOpened?: (engineId: string) => void;
}

export interface InlineBarHandle {
  host: HTMLElement;
  update(patch?: Partial<Pick<InlineBarOptions, "query" | "url" | "categoryId">>): void;
  destroy(): void;
}

const HOST_ID = "derecherche-inline-bar";
const DEFAULT_LIMIT = 6;

const INLINE_BAR_CSS = `
:host {
  position: static;
  inset: auto;
  display: block;
  width: 100%;
  z-index: auto;
  contain: layout style;
}
.bar {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 14px;
  background: var(--dr-bg);
  border-bottom: 1px solid var(--dr-border);
  font-size: 12px;
  overflow-x: auto;
  scrollbar-width: thin;
}
.bar-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100%;
  width: max-content;
}
.engine,
.more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  border: 1px solid var(--dr-border);
  border-radius: 999px;
  background: var(--dr-bg);
  color: var(--dr-fg);
  font: inherit;
  font-weight: 500;
  line-height: 1;
  padding: 7px 11px;
  cursor: pointer;
  white-space: nowrap;
}
.engine:hover,
.more:hover {
  background: var(--dr-hover);
  border-color: var(--dr-accent);
}
.engine:focus-visible,
.more:focus-visible {
  outline: 2px solid var(--dr-accent);
  outline-offset: 1px;
}
.engine.recommended {
  border-color: var(--dr-accent);
}
.spark {
  color: var(--dr-accent);
}
.mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: var(--dr-hover);
  color: var(--dr-muted);
  font-size: 10px;
  font-weight: 700;
}
.more {
  margin-left: auto;
  border-style: dashed;
  color: var(--dr-muted);
}
.sep {
  flex: none;
  width: 1px;
  height: 18px;
  margin: 0 2px;
  background: var(--dr-border);
}
`;

function resolveAnchorBlock(anchor: Element): Element {
  return anchor.closest("header, [role='banner']") ?? anchor.closest("form") ?? anchor;
}

function insertMode(insert: MountInsert): InsertPosition {
  switch (insert) {
    case "before":
      return "beforebegin";
    case "prepend":
      return "afterbegin";
    case "append":
      return "beforeend";
    default:
      return "afterend";
  }
}

function removeExisting(document: Document): void {
  document.getElementById(HOST_ID)?.remove();
}

export function mountInlineBar(options: InlineBarOptions): InlineBarHandle | null {
  const doc = options.document ?? document;
  const settings =
    options.settings ?? createDefaultSettings(options.catalog.catalogVersion);
  const sites = options.sites;
  const limit = Math.max(1, options.limit ?? DEFAULT_LIMIT);
  const commonIds = options.commonEngineIds ?? DEFAULT_COMMON_ENGINE_IDS;

  let query = options.query?.trim() ?? "";
  let url = options.url ?? doc.location?.href ?? "";
  let categoryId = options.categoryId;

  if (!query) return null;

  let site: Site | undefined;
  try {
    site = url ? matchSite(new URL(url), sites) : undefined;
  } catch {
    site = undefined;
  }

  if (!site) return null;
  const siteId = site.id;

  interface Placement {
    element: Element;
    insert: MountInsert;
  }

  function resolvePlacement(): Placement | null {
    const resolution = resolveMount(doc, site);
    options.onResolve?.(resolution);

    if (!resolution.target) {
      if (options.debug) {
        console.warn(
          "[Derecherche] no mount target",
          site?.id,
          resolution.attempts
        );
      }
      return null;
    }

    if (resolution.target.kind === "container") {
      return {
        element: resolution.target.element,
        insert: resolution.target.insert,
      };
    }

    return {
      element: resolveAnchorBlock(resolution.target.element),
      insert: "after",
    };
  }

  function insertHost(placement: Placement): void {
    placement.element.insertAdjacentElement(
      insertMode(placement.insert),
      shadow.host
    );
    shadow.host.dataset.derechercheSite = siteId;
    shadow.host.dataset.derechercheMount =
      placement.element.id ||
      placement.element.getAttribute("class") ||
      placement.element.tagName.toLowerCase();
    shadow.host.dataset.derechercheInsert = placement.insert;
  }

  let placement = resolvePlacement();
  if (!placement?.element.parentElement && placement?.insert !== "prepend" && placement?.insert !== "append") {
    return null;
  }

  removeExisting(doc);

  const shadow = createShadowHost({ id: HOST_ID, document: doc, css: INLINE_BAR_CSS });
  shadow.host.style.position = "static";
  shadow.host.style.display = "block";
  shadow.host.style.width = "100%";

  const bar = doc.createElement("div");
  bar.className = "bar";
  bar.setAttribute("role", "navigation");
  bar.setAttribute("aria-label", "Search with another engine");
  const inner = doc.createElement("div");
  inner.className = "bar-inner";
  bar.append(inner);
  shadow.content.append(bar);

  function currentCategory(): string | undefined {
    return categoryId ?? site?.defaultCategory;
  }

  function safeRender(): void {
    try {
      render();
    } catch (error) {
      shadow.unmount();
      if (options.debug) {
        console.error("[Derecherche] InlineBar render failed", error);
      }
      throw error;
    }
  }

  function render(): void {
    const category = currentCategory();
    const basePool = options.catalog.engines.filter((engine) =>
      commonIds.includes(engine.id)
    );
    const { items } = buildRankedList(
      options.catalog.engines,
      basePool.length > 0 ? basePool : options.catalog.engines,
      settings,
      {
        query,
        categoryId: category,
        categoryPath: category ? [category] : undefined,
        now: Date.now(),
      },
      {
        frecency: options.frecency,
        recommendedLimit: 3,
        maxPerProvider: 1,
      }
    );

    const shown = items.slice(0, limit);
    inner.replaceChildren();

    for (const engine of shown) {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = engine.recommended ? "engine recommended" : "engine";
      button.dataset.engineId = engine.id;
      button.title = engine.recommended
        ? `${engine.name} — recommended, click to search here, Ctrl+click for a new tab`
        : `${engine.name} — click to search here, Ctrl+click for a new tab`;

      if (engine.recommended) {
        const spark = doc.createElement("span");
        spark.className = "spark";
        spark.setAttribute("aria-hidden", "true");
        spark.textContent = "✦";
        button.append(spark);
      }

      const providerMark =
        options.catalog.providers.find((provider) => provider.id === engine.providerId)
          ?.name ?? engine.name;
      const mark = doc.createElement("span");
      mark.className = "mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = providerMark.slice(0, 1).toUpperCase();

      const name = doc.createElement("span");
      name.textContent = engine.name;
      button.append(mark, name);
      inner.append(button);
    }

    if (shown.length > 0) {
      const sep = doc.createElement("span");
      sep.className = "sep";
      sep.setAttribute("aria-hidden", "true");
      inner.append(sep);
    }

    const more = doc.createElement("button");
    more.type = "button";
    more.className = "more";
    more.dataset.action = "more";
    more.textContent = "More";
    more.title = "Open the full engine picker";
    inner.append(more);

    shadow.host.dataset.derechercheStatus = "rendered";
    shadow.host.dataset.derechercheEngines = String(shown.length);
  }

  function open(engine: Engine, mode: PaletteOpenMode): void {
    const target = buildTargetUrl(engine, query);
    if (options.onOpen) {
      options.onOpen(engine, target, mode);
    } else if (mode === "new-tab") {
      doc.defaultView?.open(target, "_blank", "noopener,noreferrer");
    } else {
      doc.defaultView?.location.assign(target);
    }
    options.onEngineOpened?.(engine.id);
  }

  function closestButton(target: EventTarget | null): HTMLElement | null {
    if (!target || typeof (target as Element).closest !== "function") return null;
    return (target as Element).closest<HTMLElement>("button");
  }

  shadow.content.addEventListener("click", (event) => {
    const button = closestButton(event.target);
    if (!button) return;

    if (button.dataset.action === "more") {
      options.onMore?.({
        query,
        categoryId: currentCategory(),
        site,
      });
      return;
    }

    const engine = options.catalog.engines.find(
      (entry) => entry.id === button.dataset.engineId
    );
    if (!engine) return;

    const newTab = event.ctrlKey || event.metaKey;
    open(engine, newTab ? "new-tab" : "current-tab");
  });

  shadow.content.addEventListener("auxclick", (event) => {
    if (event.button !== 1) return;
    const target = event.target;
    if (!target || typeof (target as Element).closest !== "function") return;
    const button = (target as Element).closest<HTMLElement>(
      "button[data-engine-id]"
    );
    if (!button) return;
    const engine = options.catalog.engines.find(
      (entry) => entry.id === button.dataset.engineId
    );
    if (!engine) return;
    event.preventDefault();
    open(engine, "new-tab");
  });

  insertHost(placement);
  safeRender();

  return {
    host: shadow.host,
    update(patch = {}) {
      if (patch.query !== undefined) query = patch.query.trim();
      if (patch.url !== undefined) url = patch.url;
      if (patch.categoryId !== undefined) categoryId = patch.categoryId;
      if (!query) {
        shadow.unmount();
        return;
      }
      const nextPlacement = resolvePlacement();
      if (nextPlacement) placement = nextPlacement;
      if (placement) insertHost(placement);
      safeRender();
    },
    destroy() {
      shadow.unmount();
    },
  };
}
