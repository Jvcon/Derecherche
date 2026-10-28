# @derecherche/core

Headless core for Derecherche. It contains no DOM, userscript, extension, or CLI APIs.

## API

- `buildTargetUrl(engine, query)` — validates the engine URL template, normalizes the query, and returns an encoded target URL.
- `normalizeQuery(input)` — trims and collapses whitespace.
- `validateEngineTemplate(engine)` — rejects missing `{q}` and non-http(s) templates.
- `extractQuery(context, sites, options)` — resolves a query from URL params, live/DOM selectors, HTML snapshot selectors, selection, or clipboard.
- `matchSite(url, sites)` — picks the most specific site adapter by host, path, params, and priority.
- `extractFromUrl`, `extractFromDocument`, `extractFromSelection`, `extractFromClipboard` — individual extraction paths for tests and hosts.
- `rankEngines(engines, settings, context, options)` — returns a stable list and a separate recommendation strip.
- `recommendationScore(engine, context, frecency)` — local, deterministic recommendation score.
- `FrecencyEntry` / `RankContext` / `RankedEngines` types.
- `normalizeSettings(input, catalogVersion)` — sanitizes persisted settings and custom engines.
- `applySettings(engines, settings)` — filters disabled engines and applies name/order/pinned overrides.
- `applyCategorySettings(categories, settings)` — hides and orders categories without mutating the catalog.
- `flattenCategories`, `findCategory`, `getCategoryPath`, `getChildCategories`, `getEnginesForCategory`.
- `createMemoryStorage()` — async storage port for tests and headless hosts.
- `StoragePort` / `HostPort` / `QueryContext` / `QueryResult` types.

## Rules

- No `window`, `document`, `GM_*`, or `browser.*`.
- No network access.
- Types from `@derecherche/data` are type-only imports.
- Settings are user overrides; the bundled catalog is read-only.
- `applySettings` preserves catalog order unless an explicit override is present.
- `rankEngines` keeps the stable list independent of query and frecency. Recommendation is a separate list and must not reorder the stable list.

## Build and test

```bash
pnpm --filter @derecherche/core build
pnpm --filter @derecherche/core typecheck
pnpm --filter @derecherche/core test
```

`test` builds first, then runs the Node test runner against `dist/`.
