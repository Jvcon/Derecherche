import type { Category, CategoryChild, Engine } from "@derecherche/data";
import type {
  CategoryOverride,
  EngineOverride,
  OpenMode,
  Settings,
  Theme,
} from "./types.js";
import { validateEngineTemplate } from "./url.js";

export const SETTINGS_SCHEMA_VERSION = 1 as const;

const OPEN_MODES: readonly OpenMode[] = [
  "new-tab",
  "current-tab",
  "background-tab",
];

const THEMES: readonly Theme[] = ["auto", "light", "dark"];

const ENGINE_ID = /^[a-z0-9][a-z0-9-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string" && item.length > 0);
  return items.length > 0 ? [...new Set(items)] : undefined;
}

function normalizeEngineOverride(value: unknown): EngineOverride | undefined {
  if (!isRecord(value)) return undefined;
  const override: EngineOverride = {};
  if (typeof value.enabled === "boolean") override.enabled = value.enabled;
  if (typeof value.pinned === "boolean") override.pinned = value.pinned;
  if (typeof value.order === "number" && Number.isFinite(value.order)) {
    override.order = value.order;
  }
  if (typeof value.name === "string" && value.name.trim()) {
    override.name = value.name.trim();
  }
  return Object.keys(override).length > 0 ? override : undefined;
}

function normalizeCategoryOverride(value: unknown): CategoryOverride | undefined {
  if (!isRecord(value)) return undefined;
  const override: CategoryOverride = {};
  if (typeof value.hidden === "boolean") override.hidden = value.hidden;
  if (typeof value.order === "number" && Number.isFinite(value.order)) {
    override.order = value.order;
  }
  return Object.keys(override).length > 0 ? override : undefined;
}

function normalizeCustomEngine(value: unknown): Engine | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value.id !== "string" ||
    !ENGINE_ID.test(value.id) ||
    typeof value.providerId !== "string" ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.category !== "string" ||
    typeof value.url !== "string"
  ) {
    return undefined;
  }

  const engine: Engine = {
    id: value.id,
    providerId: value.providerId,
    name: value.name.trim(),
    category: value.category,
    url: value.url,
    status: "active",
  };

  try {
    validateEngineTemplate(engine);
  } catch {
    return undefined;
  }

  const tags = stringArray(value.tags);
  if (tags) engine.tags = tags;
  const triggers = stringArray(value.triggers);
  if (triggers) engine.triggers = triggers;
  const regions = stringArray(value.regions);
  if (regions) engine.regions = regions;
  const languages = stringArray(value.languages);
  if (languages) engine.languages = languages;
  if (typeof value.order === "number" && Number.isFinite(value.order)) {
    engine.order = value.order;
  }
  if (typeof value.icon === "string" && value.icon) engine.icon = value.icon;

  return engine;
}

export function createDefaultSettings(catalogVersion: string): Settings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    catalogVersion,
    engines: {},
    categories: {},
    customEngines: [],
    openMode: "new-tab",
    theme: "auto",
    locale: "auto",
  };
}

export function normalizeSettings(input: unknown, catalogVersion: string): Settings {
  const settings = createDefaultSettings(catalogVersion);
  if (!isRecord(input)) return settings;

  if (typeof input.openMode === "string" && OPEN_MODES.includes(input.openMode as OpenMode)) {
    settings.openMode = input.openMode as OpenMode;
  }
  if (typeof input.theme === "string" && THEMES.includes(input.theme as Theme)) {
    settings.theme = input.theme as Theme;
  }
  if (typeof input.locale === "string" && input.locale.trim()) {
    settings.locale = input.locale.trim();
  }

  if (isRecord(input.engines)) {
    for (const [id, value] of Object.entries(input.engines)) {
      const override = normalizeEngineOverride(value);
      if (override) settings.engines[id] = override;
    }
  }

  if (isRecord(input.categories)) {
    for (const [id, value] of Object.entries(input.categories)) {
      const override = normalizeCategoryOverride(value);
      if (override) settings.categories[id] = override;
    }
  }

  if (Array.isArray(input.customEngines)) {
    const seen = new Set<string>();
    for (const value of input.customEngines) {
      const engine = normalizeCustomEngine(value);
      if (engine && !seen.has(engine.id)) {
        settings.customEngines.push(engine);
        seen.add(engine.id);
      }
    }
  }

  return settings;
}

export interface ResolvedEngine extends Engine {
  pinned: boolean;
  isCustom: boolean;
}

export function applySettings(
  engines: readonly Engine[],
  settings: Settings
): ResolvedEngine[] {
  const customIds = new Set(settings.customEngines.map((engine) => engine.id));
  const seen = new Set<string>();
  const resolved: ResolvedEngine[] = [];

  for (const engine of [...engines, ...settings.customEngines]) {
    if (seen.has(engine.id)) continue;
    seen.add(engine.id);

    const override = settings.engines[engine.id];
    if (override?.enabled === false) continue;

    resolved.push({
      ...engine,
      name: override?.name ?? engine.name,
      order: override?.order ?? engine.order,
      pinned: override?.pinned === true,
      isCustom: customIds.has(engine.id),
    });
  }

  return resolved;
}

function sortCategories<T extends CategoryChild>(
  items: readonly T[],
  overrides: Settings["categories"]
): T[] {
  return [...items].sort((a, b) => {
    const aOrder = overrides[a.id]?.order ?? a.order;
    const bOrder = overrides[b.id]?.order ?? b.order;
    return aOrder - bOrder;
  });
}

export function applyCategorySettings(
  categories: readonly Category[],
  settings: Settings
): Category[] {
  return sortCategories(categories, settings.categories)
    .filter((category) => settings.categories[category.id]?.hidden !== true)
    .map((category) => ({
      ...category,
      children: category.children
        ? sortCategories(category.children, settings.categories).filter(
            (child) => settings.categories[child.id]?.hidden !== true
          )
        : undefined,
    }));
}
