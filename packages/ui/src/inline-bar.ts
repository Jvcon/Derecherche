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

function isDocked(element: Element, view: Window): boolean {
  let node: Element | null = element;
  for (let depth = 0; node && depth < 10; depth += 1, node = node.parentElement) {
    const position = view.getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") return true;
  }
  return false;
}

function isFlexContainer(element: Element, view: Window): boolean {
  const display = view.getComputedStyle(element).display;
  return (
    display === "flex" ||
    display === "inline-flex" ||
    display === "grid" ||
    display === "inline-grid"
  );
}

/**
 * A bar inserted after an element that lives inside a flex/grid header becomes
 * a flex item on the same row. Move it after the outer flex/grid wrapper so it
 * takes its own full-width row.
 */
function relocateOutOfFlex(
  document: Document,
  host: HTMLElement,
  insert: MountInsert
): void {
  if (insert !== "before" && insert !== "after") return;
  const view = document.defaultView;
  const parent = host.parentElement;
  if (!view || !parent || parent === document.body) return;
  if (!isFlexContainer(parent, view)) return;

  let block: Element = parent;
  while (
    block.parentElement &&
    block.parentElement !== document.body &&
    isFlexContainer(block.parentElement, view)
  ) {
    block = block.parentElement;
  }

  if (!block.parentElement) return;
  block.insertAdjacentElement(
    insert === "before" ? "beforebegin" : "afterend",
    host
  );
  host.dataset.derechercheRelocated = "flex";
}

function dockedSideInset(
  document: Document,
  host: HTMLElement,
  rect: DOMRect,
  view: Window,
  side: "left" | "right"
): number {
  if (typeof document.elementFromPoint !== "function") return 0;
  const x = side === "left" ? 2 : view.innerWidth - 3;
  const y = Math.min(
    Math.max(rect.top + rect.height / 2, 0),
    view.innerHeight - 1
  );
  const hit = document.elementFromPoint(x, y);
  if (!hit || hit === host || host.contains(hit)) return 0;
  if (!isDocked(hit, view)) return 0;

  const other = hit.getBoundingClientRect();
  if (other.height < 10 || other.width < 10) return 0;
  if (other.width >= view.innerWidth * 0.9) return 0;
  if (side === "left") {
    if (rect.left >= other.right - 1) return 0;
    return other.right > 0 && other.right < view.innerWidth * 0.6
      ? Math.ceil(other.right)
      : 0;
  }
  if (rect.right <= other.left + 1) return 0;
  return other.left > view.innerWidth * 0.4 && other.left < view.innerWidth
    ? Math.ceil(view.innerWidth - other.left)
    : 0;
}

function applySideInsets(
  document: Document,
  host: HTMLElement,
  bar: HTMLElement
): void {
  const view = document.defaultView;
  if (!view) return;
  const rect = bar.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const left = dockedSideInset(document, host, rect, view, "left");
  const right = dockedSideInset(document, host, rect, view, "right");
  if (left <= 0 && right <= 0) return;

  if (left > 0) host.style.marginLeft = `${left}px`;
  if (right > 0) host.style.marginRight = `${right}px`;
  host.style.width = "auto";
  host.dataset.derechercheInset = `${left}/${right}`;
}

function clearHeaderOverlap(
  document: Document,
  host: HTMLElement,
  bar: HTMLElement,
  header: Element | null
): void {
  const view = document.defaultView;
  if (!view || !header) return;
  const rect = bar.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  let bottom = 0;
  for (const element of [header, ...header.querySelectorAll("*")]) {
    const style = view.getComputedStyle(element);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }
    const other = element.getBoundingClientRect();
    if (other.width < 1 || other.height < 1) continue;
    const overlap =
      Math.min(rect.right, other.right) - Math.max(rect.left, other.left);
    if (overlap <= 0) continue;
    if (other.top > rect.top + rect.height || other.bottom <= rect.top) {
      continue;
    }
    if (other.bottom > bottom) bottom = other.bottom;
  }

  const delta = Math.ceil(bottom - rect.top + 1);
  if (delta <= 0) return;
  const current = Number.parseFloat(host.style.paddingTop) || 0;
  host.style.paddingTop = `${current + delta}px`;
  host.dataset.derechercheOffset = String(current + delta);
}

interface TrimmedElement {
  element: HTMLElement;
  paddingTop: string;
  priority: string;
}

function trimSelectors(site: Site | undefined): string[] {
  const value = site?.mount?.trim;
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (selector) => typeof selector === "string" && selector.trim().length > 0
  );
}

/**
 * Clear page-level compensation for a fixed header. Baidu gives `#s_tab` a
 * 65px top padding so its tabs clear `#head`; once the InlineBar occupies that
 * space the padding becomes an empty gap. Adapters opt in with `mount.trim`.
 */
function applyTrim(
  document: Document,
  selectors: readonly string[],
  trimmed: TrimmedElement[]
): void {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element || trimmed.some((entry) => entry.element === element)) {
      continue;
    }
    trimmed.push({
      element,
      paddingTop: element.style.getPropertyValue("padding-top"),
      priority: element.style.getPropertyPriority("padding-top"),
    });
    element.style.setProperty("padding-top", "0px", "important");
  }
}

function restoreTrim(trimmed: TrimmedElement[]): void {
  for (const entry of trimmed) {
    if (entry.paddingTop) {
      entry.element.style.setProperty(
        "padding-top",
        entry.paddingTop,
        entry.priority
      );
    } else {
      entry.element.style.removeProperty("padding-top");
    }
  }
  trimmed.length = 0;
}

function settleLayout(
  document: Document,
  host: HTMLElement,
  bar: HTMLElement,
  scrollY: number,
  insert: MountInsert,
  header: Element | null
): void {
  if (scrollY <= 4) {
    host.style.paddingTop = "";
    host.style.marginLeft = "";
    host.style.marginRight = "";
    host.style.width = "100%";
    delete host.dataset.derechercheOffset;
    delete host.dataset.derechercheInset;
  }

  relocateOutOfFlex(document, host, insert);
  if (scrollY > 4) return;

  clearHeaderOverlap(document, host, bar, header);
  clearDockedOverlays(document, host, bar);
  applySideInsets(document, host, bar);
}

/**
 * Push the bar below a fixed or sticky search header.
 *
 * Pages such as Baidu insert their header as a fixed overlay, so a bar placed
 * after it in the DOM starts at the top of the document and is painted behind
 * the header. Padding (rather than a margin) reserves the space without margin
 * collapsing and keeps the host in normal flow.
 */
function clearDockedOverlays(
  document: Document,
  host: HTMLElement,
  bar: HTMLElement
): void {
  const view = document.defaultView;
  if (!view || typeof document.elementFromPoint !== "function") return;

  const rect = bar.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const sampleX = [0.05, 0.5, 0.95].map((fraction) => {
    const x = rect.left + rect.width * fraction;
    return Math.min(Math.max(x, 0), view.innerWidth - 1);
  });
  const sampleY = [rect.top + 2, rect.top + rect.height / 2]
    .filter((y) => y >= 0 && y < view.innerHeight)
    .map((y) => Math.min(Math.max(y, 0), view.innerHeight - 1));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let blocker: Element | null = null;
    let blockerBottom = 0;

    for (const x of sampleX) {
      for (const y of sampleY) {
        const hit = document.elementFromPoint(x, y);
        if (!hit || hit === host || host.contains(hit) || hit.contains(host)) {
          continue;
        }
        if (!isDocked(hit, view)) continue;
        const bottom = hit.getBoundingClientRect().bottom;
        if (bottom > blockerBottom) {
          blocker = hit;
          blockerBottom = bottom;
        }
      }
    }

    if (!blocker) break;
    const delta = Math.ceil(
      blocker.getBoundingClientRect().bottom - bar.getBoundingClientRect().top + 1
    );
    if (delta <= 0) break;

    const current = Number.parseFloat(host.style.paddingTop) || 0;
    host.style.paddingTop = `${current + delta}px`;
    host.dataset.derechercheOffset = String(current + delta);
  }
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
  const trims = trimSelectors(site);

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

  let currentInsert: MountInsert = "after";
  let headerBlock: Element | null = null;

  function insertHost(placement: Placement): void {
    currentInsert = placement.insert;
    headerBlock = placement.element.closest("header, [role='banner']");
    delete shadow.host.dataset.derechercheRelocated;
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
  shadow.host.style.position = "relative";
  shadow.host.style.display = "block";
  shadow.host.style.width = "100%";
  shadow.host.style.zIndex = "10";

  const trimmed: TrimmedElement[] = [];

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
      settleLayout(
        doc,
        shadow.host,
        bar,
        doc.defaultView?.scrollY ?? 0,
        currentInsert,
        headerBlock
      );
      applyTrim(doc, trims, trimmed);
    } catch (error) {
      restoreTrim(trimmed);
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

  const view = doc.defaultView;
  const timers: number[] = [];
  let settleTimer: number | undefined;
  let resizeObserver: ResizeObserver | null = null;

  function settleNow(): void {
    if (!shadow.host.isConnected) return;
    if (resizeObserver && headerBlock) resizeObserver.observe(headerBlock);
    settleLayout(
      doc,
      shadow.host,
      bar,
      view?.scrollY ?? 0,
      currentInsert,
      headerBlock
    );
  }

  function scheduleSettle(delay = 40): void {
    if (!view) return;
    if (settleTimer !== undefined) view.clearTimeout(settleTimer);
    settleTimer = view.setTimeout(() => {
      settleTimer = undefined;
      settleNow();
    }, delay);
  }

  const onResize = (): void => scheduleSettle();

  if (view) {
    for (const delay of [100, 400, 1200, 2500]) {
      timers.push(view.setTimeout(settleNow, delay));
    }
    view.addEventListener("resize", onResize);

    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => scheduleSettle(80));
      resizeObserver.observe(doc.documentElement);
      if (doc.body) resizeObserver.observe(doc.body);
    }
  }

  return {
    host: shadow.host,
    update(patch = {}) {
      if (patch.query !== undefined) query = patch.query.trim();
      if (patch.url !== undefined) url = patch.url;
      if (patch.categoryId !== undefined) categoryId = patch.categoryId;
      if (!query) {
        restoreTrim(trimmed);
        shadow.unmount();
        return;
      }
      const nextPlacement = resolvePlacement();
      if (nextPlacement) placement = nextPlacement;
      if (placement) insertHost(placement);
      safeRender();
      if (view) {
        timers.push(view.setTimeout(settleNow, 150));
        timers.push(view.setTimeout(settleNow, 1200));
      }
    },
    destroy() {
      if (view) {
        for (const timer of timers) view.clearTimeout(timer);
        if (settleTimer !== undefined) view.clearTimeout(settleTimer);
        view.removeEventListener("resize", onResize);
      }
      resizeObserver?.disconnect();
      restoreTrim(trimmed);
      shadow.unmount();
    },
  };
}
