# @derecherche/data

Search engine catalog and site extraction rules. This package is data-only; it contains no runtime UI and no host APIs.

## Layout

```text
packages/data/
├─ catalog/
│  ├─ categories.yaml       # 12 top-level categories + subcategories
│  ├─ providers.yaml        # provider metadata only
│  ├─ engines/              # engine records grouped by top-level category
│  └─ sites/                # one site adapter per file
├─ schema/                  # JSON Schema contracts
├─ generated/               # generated JSON, types, and icon manifest
└─ scripts/                 # validation and build
```

## Validate and build

```bash
pnpm install
pnpm data:validate
pnpm data:build
```

`data:build` validates first, then writes:

- `generated/catalog.json` — merged catalog consumed by hosts
- `generated/catalog.d.ts` — types for the generated data
- `generated/index.js` — ESM entry point
- `generated/icons.svg` — Simple Icons provider sprite
- `generated/icons.json` — icon manifest, license, and missing-provider list

Generated files are committed and must not be edited by hand. CI should run `data:build` and fail if the generated diff is non-empty.

## Legacy migration

```bash
pnpm data:legacy-report
```

Writes `docs/migration/legacy-engines.md` with migrated, merged, and skipped legacy engines. Migrated records live in `catalog/engines/legacy.yaml` and keep a `legacyId`.

Validation checks:

- JSON Schema conformance for categories, providers, engine files, and sites.
- Unique ids for categories, providers, engines, and sites.
- Engine provider and category references.
- Site `defaultCategory` references.
- URL protocol and `{q}` template presence.
- Duplicate engine URLs.
- `replacedBy` references.

## Rules

- Category depth is at most two: `category -> subcategory`.
- An engine has exactly one primary `category`.
- `tags` and `aliases` support discovery; they are not navigation.
- Provider is metadata, not a navigation axis.
- `category` may point to a top-level category or a subcategory.
- Aim for at least three engines before a subcategory becomes visible. Phase 0 may keep planned placeholders; the UI hides empty branches.
- `sites` may add `pathPattern` and `paramMatches` to beat a host-only adapter. More specific adapters win.
- URL templates use `{q}`; only `http` and `https` are allowed.
- Icons are referenced by id and shipped as a sprite. Do not inline base64.
- Do not put functions or executable expressions in YAML.
- The bundled catalog is read-only at runtime. User overrides live in settings.

## Adding an engine

1. Pick the provider. If it does not exist, add it to `catalog/providers.yaml`.
2. Add the engine to the matching `catalog/engines/<category>.yaml`.
3. Use exactly one primary `category`.
4. Add `tags` and `triggers` for search and recommendation.
5. Use a `{q}` URL template.
6. Add a region or language when the engine is regional.
7. Run `pnpm data:validate`.

## Adding a site adapter

1. Add `catalog/sites/<id>.yaml`.
2. Declare `hosts`, `urlParams`, query selectors, `defaultCategory`, and mount hints.
3. Keep selectors narrow; prefer URL parameters first.
4. Run `pnpm data:validate`.
5. Add a fixture under `fixtures/` when the runtime implementation begins.

## Versioning

- `schemaVersion` changes only for breaking schema changes.
- `catalogVersion` uses CalVer, e.g. `2026.10.0`.
- App releases embed a catalog version. The CLI may accept `--data <file>` later.
- Do not fetch catalog data at runtime in Phase 1.

## Licensing

- Engine names and URLs are factual data.
- Descriptions and icons must have a compatible license and provenance.
- Do not copy code or icon data from the unlicensed upstream `searchEngineJump` repository.
