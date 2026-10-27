# 0001 — Phase 1 scope and interaction decisions

- Status: accepted
- Date: 2026-10-27

## Context

Derecherche is being rebuilt from a legacy userscript into a host-agnostic search routing engine. Phase 1 targets the userscript host; Phase 2 adds a browser extension; Phase 3 adds a single-file CLI for fzf, qutebrowser, Noctalia, and DankMaterialShell.

## Decisions

### 1. Monorepo

Use a pnpm workspace. Phase 0 contains only `packages/data`; runtime packages and apps are added when their phase begins.

### 2. Phase order

1. Userscript
2. Browser extension
3. Headless CLI and launcher integrations

qutebrowser `:spawn --userscript` belongs to Phase 3, not Phase 1.

### 3. Category-first navigation

The catalog uses `category -> subcategory -> engine`, with at most two category levels. Engines may attach to either level.

### 4. Provider is display-only

`providerId` groups engines visually and provides icon fallbacks. It is not a navigation axis. Google Web, Google Images, and Google Scholar are separate engines in their respective categories.

### 5. Recommendation never reorders

The stable engine list uses catalog order plus user overrides. Recommendation appears in a separate strip and has no number bindings. `1`–`9` always map to the stable list.

### 6. Three surfaces, one picker

InlineBar, SelectionBar, and Palette share one query, category path, engine order, and icon set. InlineBar and SelectionBar are compact projections of Palette.

### 7. InlineBar visibility

InlineBar appears only on a matched result page with a non-empty query. It does not appear on search home pages.

### 8. SelectionBar behavior

SelectionBar appears automatically after text selection. It does not steal focus, ignores editable and sensitive contexts, and hides InlineBar while visible.

### 9. Open mode

Default is a new tab. `Ctrl+Enter` opens in the current tab. `Shift+Enter` opens in a background tab when the host supports it.

### 10. Icons

Icons are referenced by id and built into a sprite. No base64 in catalog entries and no remote favicon requests.

### 11. Data separation

The catalog is data-only, versioned independently from the app, and validated in CI. The bundled catalog is read-only. User overrides live in settings. Phase 1 does not fetch catalog data at runtime.

### 12. Phase 3 CLI

The CLI will be a single-file binary, with fzf as the first integration. It will consume the same core and catalog. Noctalia and DMS integrations will call the CLI rather than duplicate logic.

## Consequences

- The core must be headless from the start; `packages/core` cannot depend on `window`, `document`, `GM_*`, or `browser.*`.
- Site adapters must declare capabilities (`url`, `dom`, `html`) because launchers do not have live DOM.
- Data changes require catalog validation and review.
- Recommendation quality can improve without destabilizing keyboard muscle memory.
- Phase 3 can reuse the catalog and URL builder without a rewrite.
