import type {
  Catalog,
  Category,
  Engine,
  MountInsert,
  Provider,
  Site,
} from "@derecherche/data";

export type { Catalog, Category, Engine, MountInsert, Provider, Site };

export type QuerySource =
  | "url"
  | "searchbox"
  | "dom"
  | "html"
  | "selection"
  | "clipboard"
  | "manual";

export interface ElementLike {
  getAttribute(name: string): string | null;
  value?: string;
  textContent?: string | null;
}

export interface DocumentLike {
  querySelector(selector: string): ElementLike | null;
}

export interface QueryContext {
  url: string;
  title?: string;
  selection?: string;
  clipboard?: string;
  document?: DocumentLike;
  documentKind?: "dom" | "html";
  html?: string;
}

export interface QueryResult {
  query: string;
  source: QuerySource;
  confidence: number;
  adapterId?: string;
}

export type OpenMode = "new-tab" | "current-tab" | "background-tab";

export type Theme = "auto" | "light" | "dark";

export interface EngineOverride {
  enabled?: boolean;
  pinned?: boolean;
  order?: number;
  name?: string;
}

export interface CategoryOverride {
  hidden?: boolean;
  order?: number;
}

export interface Settings {
  schemaVersion: 1;
  catalogVersion: string;
  engines: Record<string, EngineOverride>;
  categories: Record<string, CategoryOverride>;
  customEngines: Engine[];
  openMode: OpenMode;
  theme: Theme;
  locale: "auto" | string;
}

export interface StoragePort {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys?(): Promise<string[]>;
}

export interface HostPort {
  open(url: string, options?: { mode?: OpenMode }): Promise<void> | void;
}
