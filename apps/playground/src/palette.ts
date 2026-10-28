import type { Category, CategoryChild, Engine } from "@derecherche/data";
import {
  applyCategorySettings,
  buildTargetUrl,
  createDefaultSettings,
  flattenCategories,
  getEnginesForCategory,
  rankEngines,
} from "@derecherche/core";
import { createShadowHost } from "@derecherche/ui";
import { data } from "./catalog";

export interface PaletteOptions {
  query: string;
  categoryId?: string;
  sourceLabel?: string;
}

interface CategoryItem {
  kind: "category";
  category: Category | CategoryChild;
  path: string[];
}

interface EngineItem {
  kind: "engine";
  engine: Engine;
}

type Item = CategoryItem | EngineItem;

const PALETTE_CSS = `
:host {
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: rgba(15, 18, 22, 0.36);
}
.panel {
  width: min(760px, calc(100vw - 32px));
  max-height: min(720px, 76vh);
  margin-top: 10vh;
  display: flex;
  flex-direction: column;
  background: var(--dr-bg);
  color: var(--dr-fg);
  border: 1px solid var(--dr-border);
  border-radius: 16px;
  box-shadow: var(--dr-shadow);
  overflow: hidden;
}
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--dr-border);
}
.query {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.query .label,
.source {
  color: var(--dr-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.query strong {
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.source {
  border: 1px solid var(--dr-border);
  border-radius: 999px;
  padding: 2px 6px;
}
.close,
.chip,
.item,
.crumb {
  font: inherit;
  color: inherit;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.close {
  color: var(--dr-muted);
  border: 1px solid var(--dr-border);
  border-radius: 8px;
  padding: 4px 8px;
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 8px;
}
.filter {
  width: 100%;
  border: 1px solid var(--dr-border);
  border-radius: 9px;
  background: transparent;
  color: inherit;
  padding: 9px 11px;
  font: inherit;
  outline: none;
}
.filter:focus {
  border-color: var(--dr-accent);
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--dr-muted);
}
.crumb {
  color: var(--dr-accent);
  padding: 2px 4px;
  border-radius: 5px;
}
.crumb:hover {
  background: var(--dr-hover);
}
.recommend {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 0 16px 10px;
}
.recommend:empty {
  display: none;
}
.chip {
  flex: none;
  border: 1px solid var(--dr-border);
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 12px;
}
.chip:hover {
  background: var(--dr-hover);
}
.list {
  overflow-y: auto;
  padding: 0 8px 8px;
  min-height: 80px;
}
.group-label {
  color: var(--dr-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 8px 8px 4px;
}
.item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 9px 8px;
  border-radius: 9px;
}
.item:hover,
.item.selected {
  background: var(--dr-hover);
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
  color: var(--dr-muted);
  font-size: 11px;
}
.empty {
  color: var(--dr-muted);
  padding: 18px 10px;
  text-align: center;
}
.foot {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  border-top: 1px solid var(--dr-border);
  padding: 8px 16px;
  color: var(--dr-muted);
  font-size: 11px;
}
`;

const settings = createDefaultSettings(data.catalogVersion);
const categories = applyCategorySettings(data.categories, settings);
const allFlat = flattenCategories(categories);
const categoryById = new Map(allFlat.map((entry) => [entry.category.id, entry]));
const providerById = new Map(data.providers.map((provider) => [provider.id, provider]));

let active: { close(): void } | null = null;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pathName(path: string[]): string {
  return path
    .map((id) => categoryById.get(id)?.category.name ?? id)
    .join(" / ");
}

function categoryCount(id: string): number {
  return getEnginesForCategory(data.engines, categories, id).length;
}

function markFor(engine: Engine): string {
  const provider = providerById.get(engine.providerId);
  return (provider?.name ?? engine.name).slice(0, 1).toUpperCase();
}

function engineHaystack(engine: Engine): string {
  const path = categoryById.get(engine.category)?.path ?? [engine.category];
  return [
    engine.name,
    engine.id,
    engine.providerId,
    ...(engine.tags ?? []),
    ...(engine.triggers ?? []),
    pathName(path),
  ]
    .join(" ")
    .toLowerCase();
}

export function openPalette(options: PaletteOptions): void {
  active?.close();

  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const shadow = createShadowHost({
    id: "derecherche-playground-palette",
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
    <header class="head">
      <div class="query">
        <span class="label">Query</span>
        <strong data-query></strong>
        <span class="source" data-source></span>
      </div>
      <button class="close" type="button" data-action="close">Esc</button>
    </header>
    <div class="toolbar">
      <input class="filter" data-filter type="text" autocomplete="off" spellcheck="false" placeholder="Filter engines or categories">
      <div class="breadcrumb" data-breadcrumb></div>
    </div>
    <div class="recommend" data-recommend></div>
    <div class="list" data-list></div>
    <footer class="foot">
      <span>↑↓ move</span><span>Enter open</span><span>→ enter</span><span>← back</span><span>Alt+1–9 quick pick</span>
    </footer>
  `;
  shadow.content.append(panel);

  const queryNode = panel.querySelector<HTMLElement>("[data-query]")!;
  const sourceNode = panel.querySelector<HTMLElement>("[data-source]")!;
  const filterInput = panel.querySelector<HTMLInputElement>("[data-filter]")!;
  const breadcrumbNode = panel.querySelector<HTMLElement>("[data-breadcrumb]")!;
  const recommendNode = panel.querySelector<HTMLElement>("[data-recommend]")!;
  const listNode = panel.querySelector<HTMLElement>("[data-list]")!;

  const initial = options.categoryId
    ? categoryById.get(options.categoryId)
    : undefined;
  let path = initial?.path ?? [];
  let filter = "";
  let selected = 0;
  let items: Item[] = [];
  let query = options.query.trim();

  function currentCategory(): Category | CategoryChild | undefined {
    const id = path[path.length - 1];
    return id ? categoryById.get(id)?.category : undefined;
  }

  function buildItems(): Item[] {
    const q = filter.trim().toLowerCase();
    if (q) {
      return data.engines
        .filter((engine) => engineHaystack(engine).includes(q))
        .slice(0, 60)
        .map((engine) => ({ kind: "engine", engine }));
    }

    const current = currentCategory();
    if (!current) {
      return categories.map((category) => ({
        kind: "category",
        category,
        path: [category.id],
      }));
    }

    const currentPath = path;
    const childCategories =
      "children" in current ? (current.children ?? []) : [];
    const children = childCategories.map((child) => ({
      kind: "category" as const,
      category: child,
      path: [...currentPath, child.id],
    }));
    const engines = (
      childCategories.length > 0
        ? data.engines.filter((engine) => engine.category === current.id)
        : getEnginesForCategory(data.engines, categories, current.id)
    ).map((engine) => ({ kind: "engine" as const, engine }));

    return [...children, ...engines];
  }

  function renderBreadcrumb(): void {
    const crumbs = [
      `<button class="crumb" type="button" data-path="">全部</button>`,
      ...path.map((id, index) => {
        const subPath = path.slice(0, index + 1).join("|");
        return `<span>/</span><button class="crumb" type="button" data-path="${escapeHtml(subPath)}">${escapeHtml(
          categoryById.get(id)?.category.name ?? id
        )}</button>`;
      }),
    ];
    breadcrumbNode.innerHTML = crumbs.join("");
  }

  function renderRecommendations(): void {
    const recommended = rankEngines(
      data.engines,
      settings,
      {
        query,
        categoryId: path[path.length - 1],
        now: Date.now(),
      },
      { recommendedLimit: 4 }
    ).recommended;

    if (filter.trim() || recommended.length === 0) {
      recommendNode.innerHTML = "";
      return;
    }

    recommendNode.innerHTML = recommended
      .map(
        (engine) =>
          `<button class="chip" type="button" data-engine="${escapeHtml(
            engine.id
          )}">${escapeHtml(engine.name)}</button>`
      )
      .join("");
  }

  function renderList(): void {
    if (items.length === 0) {
      listNode.innerHTML = `<div class="empty">No matches</div>`;
      return;
    }

    const rows: string[] = [];
    let lastKind: Item["kind"] | null = null;
    items.forEach((item, index) => {
      if (item.kind !== lastKind) {
        rows.push(
          `<div class="group-label">${
            item.kind === "category" ? "Categories" : "Engines"
          }</div>`
        );
        lastKind = item.kind;
      }

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
            <span class="item-hint">→</span>
          </button>
        `);
      } else {
        const category = categoryById.get(item.engine.category);
        rows.push(`
          <button class="item${index === selected ? " selected" : ""}" type="button" data-index="${index}">
            <span class="mark">${escapeHtml(markFor(item.engine))}</span>
            <span class="item-body">
              <strong>${escapeHtml(item.engine.name)}</strong>
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
    queryNode.textContent = query || "Manual query";
    sourceNode.textContent = options.sourceLabel ?? "page";
    renderBreadcrumb();
    renderRecommendations();
    items = buildItems();
    if (selected >= items.length) selected = Math.max(0, items.length - 1);
    renderList();
  }

  function ensureQuery(): string | null {
    if (query) return query;
    const entered = window.prompt("Search query")?.trim();
    if (!entered) return null;
    query = entered;
    queryNode.textContent = query;
    renderRecommendations();
    return query;
  }

  function openEngine(engine: Engine): void {
    const targetQuery = ensureQuery();
    if (!targetQuery) return;
    const url = buildTargetUrl(engine, targetQuery);
    window.open(url, "_blank", "noopener,noreferrer");
    close();
  }

  function openItem(item: Item | undefined): void {
    if (!item) return;
    if (item.kind === "category") {
      path = item.path;
      filter = "";
      filterInput.value = "";
      selected = 0;
      render();
      return;
    }
    openEngine(item.engine);
  }

  function goBack(): void {
    if (path.length === 0) return;
    path = path.slice(0, -1);
    selected = 0;
    render();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected = Math.min(items.length - 1, selected + 1);
      renderList();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selected = Math.max(0, selected - 1);
      renderList();
      return;
    }
    if (event.key === "ArrowRight") {
      const item = items[selected];
      if (item?.kind === "category") {
        event.preventDefault();
        openItem(item);
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      if (path.length > 0) {
        event.preventDefault();
        goBack();
      }
      return;
    }
    if (event.key === "Backspace" && !filterInput.value) {
      if (path.length > 0) {
        event.preventDefault();
        goBack();
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openItem(items[selected]);
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
    if (action?.dataset.action === "close") {
      close();
      return;
    }

    const engine = target.closest<HTMLElement>("[data-engine]");
    if (engine?.dataset.engine) {
      const found = data.engines.find((item) => item.id === engine.dataset.engine);
      if (found) openEngine(found);
      return;
    }

    const crumb = target.closest<HTMLElement>("[data-path]");
    if (crumb) {
      path = crumb.dataset.path ? crumb.dataset.path.split("|") : [];
      filter = "";
      filterInput.value = "";
      selected = 0;
      render();
      return;
    }

    const item = target.closest<HTMLElement>("[data-index]");
    if (item) {
      const index = Number(item.dataset.index);
      selected = index;
      openItem(items[index]);
    }
  }

  filterInput.addEventListener("input", () => {
    filter = filterInput.value;
    selected = 0;
    render();
  });
  panel.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown, true);
  render();
  filterInput.focus();

  function close(): void {
    document.removeEventListener("keydown", onKeydown, true);
    shadow.unmount();
    active = null;
    previousFocus?.focus();
  }

  active = { close };
}
