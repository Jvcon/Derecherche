# @derecherche/ui

Shared Shadow DOM, positioning, and Palette component for Derecherche.

## API

- `openPalette({ catalog, settings?, query, categoryId?, focusCategory?, commonEngineIds?, frecency?, onEngineOpened?, onOpen? })` — mounts the keyboard-first Palette. The host supplies the catalog, optional settings, and optional frecency history. `onOpen(engine, url, mode)` lets the host own new-tab/current-tab behavior; `onEngineOpened(engineId)` lets the host record usage.
- `mountInlineBar({ catalog, sites, settings?, query, url?, categoryId?, frecency?, limit?, onMore?, onOpen?, onEngineOpened? })` — inserts a page-adaptive InlineBar after the matched site adapter's container. It renders the first six `buildRankedList` engines, opens in the current tab on plain click, and opens a new tab on `Ctrl`/`Cmd` + click. Returns `{ host, update, destroy }` or `null` when there is no query or no insertion point.
- `createShadowHost({ id, css, document, zIndex })` — creates a host with `all: initial`, design tokens, dark-mode variables, a `<style>` block, and a content container.
- `positionAroundRect(anchorRect, size, options)` — computes a clamped position and flips above/below when needed.
- `positionAtAnchor(element, anchor, options)` — computes and applies `left`, `top`, and `maxWidth` styles.
- `positionFloating(element, options)` — bottom-right fallback for pages without a usable anchor.
- `observeAnchor(anchor, update, options)` — listens to scroll/resize and an optional `ResizeObserver`; returns a cleanup function.
- `trackAnchor(element, anchor, options)` — positions once and keeps the position updated.

## Rules

- Shadow DOM only; no host-page CSS leaks.
- The Palette receives its catalog and settings from the host; never import `apps/playground` data.
- Hosts should pass `onOpen` when they need extension/userscript tab semantics.
- The Palette and InlineBar render one deduplicated list: pinned engines, up to three recommended engines (max one per provider), then the stable rest. Recommended rows carry a `✦` marker.
- InlineBar and SelectionBar are independent. Neither hides the other.
- InlineBar inserts into the host page flow; it is not a fixed overlay.
- No framework dependency.
- No remote assets.
- `unmount()` must remove the host and all listeners created by `observeAnchor`.
- Positioning must stay within the viewport and flip when there is not enough space.
- qutebrowser / QtWebEngine remains a compatibility target; avoid APIs unavailable in current QtWebEngine.

## Demo

```bash
pnpm --filter @derecherche/ui build
python3 -m http.server 8080 --directory packages/ui
# open http://localhost:8080/demo/
```

The demo mounts a fixed surface under a button anchor.

## Tests

```bash
pnpm --filter @derecherche/ui test
```

Tests use `happy-dom` and cover mount/unmount, style isolation, viewport clamping, flipping, anchor positioning, observer cleanup, InlineBar insertion, current-tab/new-tab clicks, deduplication, and empty-query handling.
