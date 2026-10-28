# @derecherche/core

Headless core for Derecherche. It contains no DOM, userscript, extension, or CLI APIs.

## API

- `buildTargetUrl(engine, query)` — validates the engine URL template, normalizes the query, and returns an encoded target URL.
- `normalizeQuery(input)` — trims and collapses whitespace.
- `validateEngineTemplate(engine)` — rejects missing `{q}` and non-http(s) templates.
- `extractQuery(context, sites, options)` — resolves a query from URL params, live/DOM selectors, HTML snapshot selectors, selection, or clipboard.
- `matchSite(url, sites)` — picks the most specific site adapter by host, path, params, and priority.
- `extractFromUrl`, `extractFromDocument`, `extractFromSelection`, `extractFromClipboard` — individual extraction paths for tests and hosts.
- `buildRankedList(candidatePool, basePool, settings, context, options)` — returns one deduplicated list: pinned, up to three recommendations, then the stable rest.
- `rankEngines(engines, settings, context, options)` — lower-level stable + recommended split used by `buildRankedList`.
- `recommendationScore(engine, context, frecency)` — local, deterministic recommendation score.
- `resolveMount(document, site, options)` — resolves the InlineBar mount target through ordered `mount.rules`, with selector diagnostics and generic fallback.
- `FrecencyEntry` / `RankContext` / `RankedEngines` / `MountResolution` types.
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
- `buildRankedList` keeps the stable tail independent of query and frecency. Recommendations only occupy the head and are deduplicated.
- `resolveMount` never executes selectors from YAML; it only calls `querySelector` on the supplied document and records attempts.

## Build and test

```bash
pnpm --filter @derecherche/core build
pnpm --filter @derecherche/core typecheck
pnpm --filter @derecherche/core test
```

`test` builds first, then runs the Node test runner against `dist/`.

## Fixtures

Site fixtures live in [`fixtures/`](../../fixtures/README.md). Each fixture is exercised in URL-only, HTML-snapshot, and live-DOM modes. Mount fixtures are exercised by the UI test suite. Tests run offline with `happy-dom`.
