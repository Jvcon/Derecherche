import type {
  MountInsert,
  MountRule,
  MountSelector,
  Site,
} from "@derecherche/data";
import type { ElementLike } from "./types.js";

export interface MountDocument<E extends ElementLike = ElementLike> {
  querySelector(selector: string): E | null;
}

export type MountTargetKind = "container" | "anchor";
export type MountTargetSource = "adapter" | "generic";

export interface MountTarget<E extends ElementLike = ElementLike> {
  element: E;
  selector: string;
  kind: MountTargetKind;
  insert: MountInsert;
  source: MountTargetSource;
}

export interface MountAttempt {
  selector: string;
  kind: MountTargetKind;
  source: MountTargetSource;
  found: boolean;
  error?: string;
}

export interface MountResolution<E extends ElementLike = ElementLike> {
  target: MountTarget<E> | null;
  attempts: MountAttempt[];
}

export interface MountResolveOptions {
  genericFallback?: boolean;
}

export const GENERIC_MOUNT_CONTAINERS = [
  "header",
  "[role='banner']",
] as const;

export const GENERIC_MOUNT_ANCHORS = [
  "form[role='search']",
  "input[type='search']",
  "input[name='q']",
  "input[name='wd']",
  "input[name='keyword']",
  "input[name='search_query']",
] as const;

function selectors(value: MountSelector | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (selector) => typeof selector === "string" && selector.trim().length > 0
  );
}

function rulesFor(site: Site | undefined): MountRule[] {
  if (!site?.mount) return [];
  if (site.mount.rules?.length) return site.mount.rules;
  if (site.mount.container || site.mount.anchor) {
    return [
      {
        container: site.mount.container,
        anchor: site.mount.anchor,
        insert: site.mount.insert,
      },
    ];
  }
  return [];
}

function trySelectors<E extends ElementLike>(
  document: MountDocument<E>,
  values: readonly string[],
  kind: MountTargetKind,
  source: MountTargetSource,
  insert: MountInsert,
  attempts: MountAttempt[]
): MountTarget<E> | null {
  for (const selector of values) {
    try {
      const element = document.querySelector(selector);
      attempts.push({ selector, kind, source, found: Boolean(element) });
      if (element) {
        return { element, selector, kind, insert, source };
      }
    } catch (error) {
      attempts.push({
        selector,
        kind,
        source,
        found: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return null;
}

/**
 * Resolve the place where the InlineBar should be inserted.
 *
 * Adapter rules are evaluated in order. Each rule tries its container selectors
 * first, then its anchor selectors. A container is used as-is; an anchor is a
 * last-resort block (the host lifts it to the nearest header/form).
 *
 * Generic header/search-input fallbacks run only after adapter selectors miss,
 * and only when `mount.required` is not set.
 */
export function resolveMount<E extends ElementLike>(
  document: MountDocument<E>,
  site?: Site,
  options: MountResolveOptions = {}
): MountResolution<E> {
  const attempts: MountAttempt[] = [];
  const rules = rulesFor(site);

  for (const rule of rules) {
    const insert = rule.insert ?? "after";
    const container = trySelectors(
      document,
      selectors(rule.container),
      "container",
      "adapter",
      insert,
      attempts
    );
    if (container) return { target: container, attempts };

    const anchor = trySelectors(
      document,
      selectors(rule.anchor),
      "anchor",
      "adapter",
      insert,
      attempts
    );
    if (anchor) return { target: anchor, attempts };
  }

  if (site?.mount?.required || options.genericFallback === false) {
    return { target: null, attempts };
  }

  const genericContainer = trySelectors(
    document,
    GENERIC_MOUNT_CONTAINERS,
    "container",
    "generic",
    "after",
    attempts
  );
  if (genericContainer) return { target: genericContainer, attempts };

  const genericAnchor = trySelectors(
    document,
    GENERIC_MOUNT_ANCHORS,
    "anchor",
    "generic",
    "after",
    attempts
  );
  return { target: genericAnchor, attempts };
}
