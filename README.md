# Derecherche

A host-agnostic search routing engine: given a query context, resolve the query, choose an engine, and produce the target URL.

Derecherche started as a search-engine jump userscript. The project is being rebuilt around a headless core so the same catalog and resolution logic can power:

1. **Phase 1 — Userscript** (Tampermonkey / Violentmonkey / qutebrowser Greasemonkey)
2. **Phase 2 — Browser extension** (Chrome / Edge / Firefox)
3. **Phase 3 — Headless CLI** (fzf, qutebrowser `:spawn --userscript`, Noctalia, DankMaterialShell)

## Status

Phase 0 data and interaction contracts are in place. Foundation work is in progress: the catalog build pipeline and CI gates are implemented; catalog migration, icon sprite, and licensing remain.

## Repository layout

```text
.
├─ packages/
│  ├─ core/                 # host-agnostic query, settings, URL, storage primitives
│  ├─ ui/                   # Shadow DOM and positioning primitives
│  └─ data/                 # catalog, schemas, validation
├─ docs/
│  └─ contracts/            # interaction and data contracts
├─ fixtures/                # offline site extraction fixtures
├─ legacy/                  # archived reference code, not built
├─ package.json
└─ pnpm-workspace.yaml
```

Planned later:

```text
packages/
├─ ui/                      # Shadow DOM InlineBar / SelectionBar / Palette
├─ host-userscript/
├─ host-extension/
└─ host-cli/
apps/
├─ userscript/
├─ extension/
└─ cli/
```

## Phase 1 interaction decisions

- Category → subcategory → engine, with at most two category levels.
- Category is the primary navigation axis; provider is a display enhancement only.
- Recommendation never reorders the stable engine list. It appears in a separate strip.
- InlineBar appears only on result pages with a query.
- SelectionBar appears automatically after text selection, and hides InlineBar while visible.
- Default open mode is a new tab; `Ctrl+Enter` opens in the current tab.
- Icons are bundled as a build-time sprite; no inline base64 in catalog entries.
- Userscript delivery is Phase 1; `:spawn --userscript` is Phase 3.

See:

- [docs/contracts/picker-contract.md](docs/contracts/picker-contract.md) for the full interaction contract.
- [docs/taxonomy.md](docs/taxonomy.md) for the category design and legacy mapping.
- [docs/decisions/0001-phase-1-scope.md](docs/decisions/0001-phase-1-scope.md) for the accepted Phase 1 decisions.

## Data

The catalog is data, not code:

```text
packages/data/catalog/
├─ categories.yaml
├─ providers.yaml
├─ engines/
│  └─ *.yaml
├─ sites/
│  └─ *.yaml
└─ icons/
```

Validate and build the catalog:

```bash
pnpm install
pnpm data:validate
pnpm data:build
```

Run the local check suite with `pnpm check` (lint, typecheck, tests, and build).

The generated catalog lives in `packages/data/generated/`. It is committed and consumed by future hosts.

See [`docs/migration/legacy-engines.md`](docs/migration/legacy-engines.md) for the legacy engine migration report.

The data package is intentionally not published. The external contract for future integrations will be the CLI and JSON catalog, not an npm library.

## Legacy code

All pre-rewrite userscripts, templates, dumps, and references live under [`legacy/`](legacy/README.md). They are archived for historical reference and are not part of the build.

The upstream `searchEngineJump` repository has no license file. Do not copy its code into the new runtime without clarifying permission. Engine names and URLs are factual data, but the old implementation should be treated as reference only.

## License

Derecherche is licensed under **GPL-3.0-only**. See [`LICENSE`](LICENSE) and [`docs/legal.md`](docs/legal.md) for the license, legacy audit, and icon provenance.
