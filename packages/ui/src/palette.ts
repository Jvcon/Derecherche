import type {
  Catalog,
  Category,
  CategoryChild,
  Engine,
  Provider,
} from "@derecherche/data";
import {
  applyCategorySettings,
  buildRankedList,
  buildTargetUrl,
  createDefaultSettings,
  flattenCategories,
  getEnginesForCategory,
  type FlatCategory,
  type FrecencyEntry,
  type RankContext,
  type Settings,
} from "@derecherche/core";
import { DEFAULT_COMMON_ENGINE_IDS } from "./defaults.js";
import { createShadowHost } from "./shadow.js";

export type PaletteOpenMode = "new-tab" | "current-tab";

export interface PaletteOptions {
  catalog: Catalog;
  settings?: Settings;
  query: string;
  categoryId?: string;
  focusCategory?: boolean;
  sourceLabel?: string;
  commonEngineIds?: string[];
  frecency?: readonly FrecencyEntry[];
  onEngineOpened?: (engineId: string) => void;
  onOpen?: (engine: Engine, url: string, mode: PaletteOpenMode) => void;
}

interface CategoryItem {
  kind: "category";
  category: Category | CategoryChild;
  path: string[];
}

interface EngineItem {
  kind: "engine";
  engine: Engine;
  recommended: boolean;
}

type Item = CategoryItem | EngineItem;
type Mode = "query" | "category";

interface Action {
  id: "copy" | "current";
  label: string;
  shortcut: string[];
}

const ACTIONS: Action[] = [
  { id: "copy", label: "Copy target URL", shortcut: ["⌥", "C"] },
  { id: "current", label: "Open in current tab", shortcut: ["⌥", "↵"] },
];

const PALETTE_CSS = `
:host {
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: rgba(15, 18, 22, 0.42);
}
.panel {
  position: relative;
  width: min(780px, calc(100vw - 32px));
  margin-top: 9vh;
  display: flex;
  flex-direction: column;
  background: var(--dr-bg);
  color: var(--dr-fg);
  border: 1px solid var(--dr-border);
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}
.input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--dr-border);
}
.back {
  flex: none;
  width: 28px;
  height: 28px;
  border: 1px solid var(--dr-border);
  border-radius: 7px;
  background: transparent;
  color: var(--dr-muted);
  font: inherit;
  cursor: pointer;
}
.back:hover {
  background: var(--dr-hover);
}
.back[hidden] {
  display: none;
}
.token {
  flex: none;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid var(--dr-border);
  border-radius: 7px;
  padding: 5px 8px;
  font-size: 12px;
  background: var(--dr-hover);
  color: var(--dr-fg);
}
.query-token {
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  text-align: left;
}
.query-token:hover {
  outline: 1px solid var(--dr-border);
}
.category-token {
  color: var(--dr-muted);
  font-size: 12px;
}
.input {
  flex: 1;
  min-width: 120px;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 16px;
  padding: 6px 2px;
}
.input::placeholder {
  color: var(--dr-muted);
}
.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--dr-border);
  border-bottom-width: 2px;
  border-radius: 6px;
  color: var(--dr-muted);
  font: 600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.04em;
  background: var(--dr-bg);
}
.result-panel {
  display: flex;
  flex-direction: column;
  max-height: min(520px, 58vh);
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 4px;
  color: var(--dr-muted);
  font-size: 11px;
}
.list {
  overflow-y: auto;
  padding: 0 8px 8px;
  min-height: 54px;
}
.item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 8px;
  border-radius: 9px;
  cursor: pointer;
}
.item:hover,
.item.selected {
  background: var(--dr-hover);
}
.rec-mark {
  color: var(--dr-accent);
  margin-right: 4px;
}
.mark {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  border: 1px solid var(--dr-border);
  font-size: 12px;
  font-weight: 600;
}
.item-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.item-body strong {
  font-size: 13px;
  font-weight: 600;
}
.item-body small {
  color: var(--dr-muted);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-hint {
  flex: none;
  color: var(--dr-muted);
  font-size: 11px;
}
.empty {
  color: var(--dr-muted);
  padding: 18px 10px;
  text-align: center;
}
.action-menu {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2;
  width: 280px;
  padding: 6px;
  background: var(--dr-bg);
  border: 1px solid var(--dr-border);
  border-radius: 10px;
  box-shadow: var(--dr-shadow);
}
.action-menu[hidden] {
  display: none;
}
.shortcut-keys {
  display: inline-flex;
  gap: 4px;
}
.action {
  width: 100%;
  display: flex;
  justify-content: space-between;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
}
.action:hover,
.action.selected {
  background: var(--dr-hover);
}
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--dr-border);
  padding: 8px 14px;
  color: var(--dr-muted);
  font-size: 11px;
}
.status-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-path {
  color: var(--dr-fg);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}
.hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.hint.disabled {
  opacity: 0.35;
}
`;

let active: { close(): void } | null = null;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pathNameOf(
  path: string[],
  categoryById: Map<string, FlatCategory>
): string {
  return path
    .map((id) => categoryById.get(id)?.category.name ?? id)
    .join(" / ");
}

function categoryCountOf(
  id: string,
  engines: readonly Engine[],
  categories: readonly Category[]
): number {
  return getEnginesForCategory(engines, categories, id).length;
}

function markForOf(
  engine: Engine,
  providerById: Map<string, Provider>
): string {
  const provider = providerById.get(engine.providerId);
  return (provider?.name ?? engine.name).slice(0, 1).toUpperCase();
}

function engineHaystackOf(
  engine: Engine,
  categoryById: Map<string, FlatCategory>
): string {
  const path = categoryById.get(engine.category)?.path ?? [engine.category];
  return [
    engine.name,
    engine.id,
    engine.providerId,
    ...(engine.tags ?? []),
    ...(engine.triggers ?? []),
    pathNameOf(path, categoryById),
  ]
    .join(" ")
    .toLowerCase();
}

function categoryHaystackOf(
  category: Category | CategoryChild,
  path: string[],
  categoryById: Map<string, FlatCategory>
): string {
  return [
    category.name,
    category.id,
    ...(category.aliases ?? []),
    pathNameOf(path, categoryById),
  ]
    .join(" ")
    .toLowerCase();
}

export function openPalette(options: PaletteOptions): void {
  active?.close();

  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const shadow = createShadowHost({
    id: "derecherche-palette",
    document,
    css: PALETTE_CSS,
  });
  shadow.mount(document.body);

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Derecherche engine picker");
  panel.innerHTML = `
    <header class="input-bar">
      <button class="back" type="button" data-action="back" hidden aria-label="Back">←</button>
      <button class="token query-token" type="button" data-action="edit-keyword" hidden></button>
      <span class="token category-token" data-category-token hidden></span>
      <input class="input" data-input type="text" autocomplete="off" spellcheck="false">
      <kbd class="key">⇥</kbd>
    </header>
    <section class="result-panel">
      <div class="panel-head"><span data-mode>Common engines</span></div>
      <div class="list" data-list></div>
    </section>
    <div class="action-menu" data-actions hidden></div>
    <footer class="status-bar">
      <div class="status-left">
        <span class="status-path" data-status-path>Common engines</span>
      </div>
      <div class="status-right">
        <span class="hint"><span>Open</span><kbd class="key">↵</kbd></span>
        <span class="hint" data-hint-action><span>Action</span><kbd class="key">⌥</kbd><kbd class="key">L</kbd></span>
      </div>
    </footer>
  `;
  shadow.content.append(panel);

  const input = panel.querySelector<HTMLInputElement>("[data-input]")!;
  const backButton = panel.querySelector<HTMLButtonElement>('[data-action="back"]')!;
  const queryToken = panel.querySelector<HTMLButtonElement>('[data-action="edit-keyword"]')!;
  const categoryToken = panel.querySelector<HTMLElement>("[data-category-token]")!;
  const modeNode = panel.querySelector<HTMLElement>("[data-mode]")!;
  const listNode = panel.querySelector<HTMLElement>("[data-list]")!;
  const actionsNode = panel.querySelector<HTMLElement>("[data-actions]")!;
  const statusPath = panel.querySelector<HTMLElement>("[data-status-path]")!;
  const statusBar = panel.querySelector<HTMLElement>(".status-bar")!;
  const actionHint = panel.querySelector<HTMLElement>("[data-hint-action]")!;

  const catalog = options.catalog;
  const settings =
    options.settings ?? createDefaultSettings(catalog.catalogVersion);
  const categories = applyCategorySettings(catalog.categories, settings);
  const allFlat = flattenCategories(categories);
  const categoryById = new Map(allFlat.map((entry) => [entry.category.id, entry]));
  const providerById = new Map(
    catalog.providers.map((provider) => [provider.id, provider])
  );
  const pathName = (path: string[]): string => pathNameOf(path, categoryById);
  const categoryCount = (id: string): number =>
    categoryCountOf(id, catalog.engines, categories);
  const markFor = (engine: Engine): string =>
    markForOf(engine, providerById);
  const engineHaystack = (engine: Engine): string =>
    engineHaystackOf(engine, categoryById);
  const categoryHaystack = (
    category: Category | CategoryChild,
    path: string[]
  ): string => categoryHaystackOf(category, path, categoryById);

  const initial = options.categoryId
    ? categoryById.get(options.categoryId)
    : undefined;
  const startInCategory = Boolean(options.focusCategory && initial);
  let mode: Mode = startInCategory ? "category" : "query";
  let path: string[] = startInCategory ? (initial?.path ?? []) : [];
  let query = options.query.trim();
  let filter = "";
  let selected = 0;
  let items: Item[] = [];
  let actionMenuOpen = false;
  let actionIndex = 0;

  const commonIds = options.commonEngineIds?.length
    ? options.commonEngineIds
    : DEFAULT_COMMON_ENGINE_IDS;
  const commonEngines = commonIds
    .map((id) => catalog.engines.find((engine) => engine.id === id))
    .filter((engine): engine is Engine => engine !== undefined && engine.status === "active")
    .slice(0, 8);
  const fallbackCommon = catalog.engines
    .filter((engine) => engine.status === "active")
    .slice(0, 6);
  const common = commonEngines.length > 0 ? commonEngines : fallbackCommon;

  function currentCategory(): Category | CategoryChild | undefined {
    const id = path[path.length - 1];
    return id ? categoryById.get(id)?.category : undefined;
  }

  function selectedItem(): Item | undefined {
    return items[selected];
  }

  function selectedEngine(): Engine | undefined {
    const item = selectedItem();
    return item?.kind === "engine" ? item.engine : undefined;
  }

  function scopeCategoryIds(scopeId: string): string[] {
    const ids = [scopeId];
    const category = categoryById.get(scopeId)?.category;
    if (category && "children" in category) {
      for (const child of category.children ?? []) ids.push(child.id);
    }
    return ids;
  }

  function rankedEngineItems(
    candidatePool: readonly Engine[],
    basePool: readonly Engine[],
    context: RankContext
  ): EngineItem[] {
    return buildRankedList(candidatePool, basePool, settings, context, {
      frecency: options.frecency,
      recommendedLimit: 3,
      maxPerProvider: 1,
    }).items.map((engine) => ({
      kind: "engine" as const,
      engine,
      recommended: engine.recommended,
    }));
  }

  function buildItems(): Item[] {
    if (mode === "query") {
      return rankedEngineItems(catalog.engines, common, {
        query,
        categoryId: initial?.category.id,
        categoryPath: initial?.path,
        now: Date.now(),
      });
    }

    const q = filter.trim().toLowerCase();
    const current = currentCategory();

    if (!current) {
      const categoryItems: Item[] = categories
        .filter((category) => categoryHaystack(category, [category.id]).includes(q))
        .map((category) => ({
          kind: "category",
          category,
          path: [category.id],
        }));

      if (!q) return categoryItems;

      const matches = catalog.engines
        .filter((engine) => engine.status === "active" && engineHaystack(engine).includes(q))
        .slice(0, 60);
      return [...categoryItems, ...rankedEngineItems(matches, matches, {
        query,
        now: Date.now(),
      })];
    }

    const childCategories =
      "children" in current ? (current.children ?? []) : [];
    const categoryItems: Item[] = childCategories
      .map((child) => ({
        kind: "category" as const,
        category: child,
        path: [...path, child.id],
      }))
      .filter((item) => !q || categoryHaystack(item.category, item.path).includes(q));

    const scopedEngines = getEnginesForCategory(
      catalog.engines,
      categories,
      current.id
    ).filter((engine) => engine.status === "active");
    const matchingEngines = q
      ? scopedEngines.filter((engine) => engineHaystack(engine).includes(q))
      : scopedEngines;
    const basePool =
      q || childCategories.length === 0
        ? matchingEngines
        : matchingEngines.filter((engine) => engine.category === current.id);

    return [
      ...categoryItems,
      ...rankedEngineItems(matchingEngines, basePool, {
        query,
        categoryId: current.id,
        categoryPath: path,
        scopeIds: scopeCategoryIds(current.id),
        now: Date.now(),
      }),
    ];
  }

  function renderInput(): void {
    backButton.hidden = mode === "query";
    queryToken.hidden = mode === "query";
    queryToken.textContent = query || "No keyword";
    queryToken.title = query || "No keyword";
    categoryToken.hidden = mode === "query" || path.length === 0;
    categoryToken.textContent = path.length > 0 ? pathName(path) : "";
    input.placeholder =
      mode === "query"
        ? "Type a search keyword"
        : "Filter categories and engines";
    input.setAttribute("aria-label", mode === "query" ? "Search keyword" : "Filter categories and engines");
  }

  function positionActionMenu(): void {
    actionsNode.style.bottom = `${statusBar.offsetHeight}px`;
  }

  function renderActions(): void {
    const engine = selectedEngine();
    if (!actionMenuOpen || !engine) {
      actionsNode.hidden = true;
      actionsNode.innerHTML = "";
      return;
    }
    positionActionMenu();
    actionsNode.hidden = false;
    actionsNode.innerHTML = ACTIONS.map(
      (action, index) =>
        `<button class="action${index === actionIndex ? " selected" : ""}" type="button" data-action="${action.id}">
          <span>${escapeHtml(action.label)}</span>
          <span class="shortcut-keys">${action.shortcut
            .map((key) => `<kbd class="key">${escapeHtml(key)}</kbd>`)
            .join("")}</span>
        </button>`
    ).join("");
  }

  function renderList(): void {
    if (items.length === 0) {
      listNode.innerHTML = `<div class="empty">${
        filter.trim() ? "No matching engines" : "No engines available"
      }</div>`;
      return;
    }

    const rows: string[] = [];
    items.forEach((item, index) => {
      if (item.kind === "category") {
        rows.push(`
          <button class="item${index === selected ? " selected" : ""}" type="button" data-index="${index}">
            <span class="mark">${escapeHtml(item.category.name.slice(0, 1))}</span>
            <span class="item-body">
              <strong>${escapeHtml(item.category.name)}</strong>
              <small>${escapeHtml(pathName(item.path))} · ${categoryCount(
                item.category.id
              )} engines</small>
            </span>
            <span class="item-hint">⇥</span>
          </button>
        `);
      } else {
        const category = categoryById.get(item.engine.category);
        rows.push(`
          <button class="item${index === selected ? " selected" : ""}" type="button" data-index="${index}">
            <span class="mark">${escapeHtml(markFor(item.engine))}</span>
            <span class="item-body">
              <strong>${item.recommended ? '<span class="rec-mark" title="Recommended">✦</span>' : ""}${escapeHtml(item.engine.name)}</strong>
              <small>${escapeHtml(
                category ? pathName(category.path) : item.engine.category
              )} · ${escapeHtml(item.engine.providerId)}</small>
            </span>
            <span class="item-hint">${index < 9 ? index + 1 : ""}</span>
          </button>
        `);
      }
    });

    listNode.innerHTML = rows.join("");
    listNode
      .querySelector<HTMLElement>(".item.selected")
      ?.scrollIntoView({ block: "nearest" });
  }

  function render(): void {
    items = buildItems();
    if (selected >= items.length) selected = Math.max(0, items.length - 1);
    modeNode.textContent = "Engines";
    statusPath.textContent =
      mode === "query"
        ? "Common engines"
        : path.length > 0
          ? pathName(path)
          : filter.trim()
            ? "All categories"
            : "Categories";
    actionHint.classList.toggle("disabled", !selectedEngine());
    renderInput();
    renderList();
    renderActions();
  }

  function ensureQuery(): string | null {
    if (query) return query;
    const entered = window.prompt("Search query")?.trim();
    if (!entered) return null;
    query = entered;
    if (mode === "query") input.value = query;
    render();
    return query;
  }

  function openEngine(engine: Engine): void {
    const targetQuery = ensureQuery();
    if (!targetQuery) return;
    const url = buildTargetUrl(engine, targetQuery);
    if (options.onOpen) {
      options.onOpen(engine, url, "new-tab");
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    options.onEngineOpened?.(engine.id);
    close();
  }

  function enterCategory(item: CategoryItem): void {
    path = item.path;
    mode = "category";
    filter = "";
    input.value = "";
    selected = 0;
    actionMenuOpen = false;
    render();
    input.focus();
  }

  function openItem(item: Item | undefined): void {
    if (!item) return;
    if (item.kind === "category") {
      enterCategory(item);
      return;
    }
    openEngine(item.engine);
  }

  function exitToKeyword(): void {
    mode = "query";
    filter = "";
    selected = 0;
    actionMenuOpen = false;
    input.value = query;
    render();
    input.focus();
  }

  function goBack(): void {
    if (filter) {
      filter = "";
        input.value = "";
      selected = 0;
      render();
      return;
    }
    if (path.length > 0) {
      path = path.slice(0, -1);
      selected = 0;
      render();
      return;
    }
    if (mode === "category") exitToKeyword();
  }

  function enterCategoryMode(): void {
    mode = "category";
    path = [];
    filter = "";
    input.value = "";
    selected = 0;
    actionMenuOpen = false;
    render();

    const preferredRoot = initial?.path[0];
    if (preferredRoot) {
      const index = items.findIndex(
        (item) => item.kind === "category" && item.category.id === preferredRoot
      );
      if (index >= 0) {
        selected = index;
        renderList();
      }
    }

    input.focus();
  }

  function executeAction(action: Action): void {
    const engine = selectedEngine();
    if (!engine) return;
    const targetQuery = ensureQuery();
    if (!targetQuery) return;
    const url = buildTargetUrl(engine, targetQuery);

    if (action.id === "copy") {
      void navigator.clipboard?.writeText(url).catch(() => undefined);
      actionMenuOpen = false;
      renderActions();
      return;
    }
    if (action.id === "current") {
      if (options.onOpen) {
        options.onOpen(engine, url, "current-tab");
        close();
      } else {
        window.location.href = url;
      }
      options.onEngineOpened?.(engine.id);
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      if (actionMenuOpen) {
        actionMenuOpen = false;
        renderActions();
      } else {
        close();
      }
      return;
    }

    // macOS turns Option+L into "¬", so use the physical key code.
    const isActionShortcut =
      event.altKey &&
      (event.code === "KeyL" || event.key.toLowerCase() === "l");
    if (isActionShortcut) {
      event.preventDefault();
      if (selectedEngine()) {
        actionMenuOpen = !actionMenuOpen;
        actionIndex = 0;
        renderActions();
      }
      return;
    }

    if (actionMenuOpen) {
      const copyShortcut =
        event.altKey &&
        (event.code === "KeyC" || event.key.toLowerCase() === "c");
      if (copyShortcut) {
        event.preventDefault();
        executeAction(ACTIONS[0]);
        return;
      }
      const currentShortcut =
        event.altKey &&
        (event.code === "Enter" || event.key === "Enter");
      if (currentShortcut) {
        event.preventDefault();
        executeAction(ACTIONS[1]);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        actionIndex = Math.min(ACTIONS.length - 1, actionIndex + 1);
        renderActions();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        actionIndex = Math.max(0, actionIndex - 1);
        renderActions();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        executeAction(ACTIONS[actionIndex]);
      }
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      if (mode === "query") {
        enterCategoryMode();
        return;
      }
      const item = selectedItem();
      if (item?.kind === "category") enterCategory(item);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected = Math.min(items.length - 1, selected + 1);
      render();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selected = Math.max(0, selected - 1);
      render();
      return;
    }
    if (event.key === "ArrowRight") {
      const item = selectedItem();
      if (item?.kind === "category") {
        event.preventDefault();
        enterCategory(item);
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goBack();
      return;
    }
    if (event.key === "Backspace" && !input.value) {
      event.preventDefault();
      goBack();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openItem(selectedItem());
      return;
    }
    if (event.altKey && /^[1-9]$/.test(event.key)) {
      event.preventDefault();
      const index = Number(event.key) - 1;
      if (index < items.length) openItem(items[index]);
    }
  }

  function onClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target) return;

    const action = target.closest<HTMLElement>("[data-action]");
    if (action?.dataset.action === "back") {
      goBack();
      return;
    }
    if (action?.dataset.action === "edit-keyword") {
      exitToKeyword();
      return;
    }
    if (action?.dataset.action) {
      const found = ACTIONS.find((item) => item.id === action.dataset.action);
      if (found) executeAction(found);
      return;
    }

    const item = target.closest<HTMLElement>("[data-index]");
    if (item) {
      const index = Number(item.dataset.index);
      selected = index;
      openItem(items[index]);
    }
  }

  input.addEventListener("input", () => {
    if (mode === "query") {
      query = input.value;
    } else {
      filter = input.value;
      selected = 0;
    }
    render();
  });

  panel.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown, true);
  input.value = mode === "query" ? query : "";
  render();
  input.focus();

  function close(): void {
    document.removeEventListener("keydown", onKeydown, true);
    shadow.unmount();
    active = null;
    previousFocus?.focus();
  }

  active = { close };
}
