# @derecherche/ui

Shared Shadow DOM and positioning primitives for the InlineBar, SelectionBar, and Palette.

## API

- `createShadowHost({ id, css, document, zIndex })` — creates a host with `all: initial`, design tokens, dark-mode variables, a `<style>` block, and a content container.
- `positionAroundRect(anchorRect, size, options)` — computes a clamped position and flips above/below when needed.
- `positionAtAnchor(element, anchor, options)` — computes and applies `left`, `top`, and `maxWidth` styles.
- `positionFloating(element, options)` — bottom-right fallback for pages without a usable anchor.
- `observeAnchor(anchor, update, options)` — listens to scroll/resize and an optional `ResizeObserver`; returns a cleanup function.
- `trackAnchor(element, anchor, options)` — positions once and keeps the position updated.

## Rules

- Shadow DOM only; no host-page CSS leaks.
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

Tests use `happy-dom` and cover mount/unmount, style isolation, viewport clamping, flipping, anchor positioning, and observer cleanup.
