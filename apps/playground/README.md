# Derecherche playground

Development harness for the Palette, InlineBar, and SelectionBar. It is not a production app.

## Run

```bash
pnpm dev:playground
# http://localhost:5173
```

`dev:playground` builds `packages/core` and `packages/ui` first, then starts Vite. The playground imports the built packages through Vite aliases.

If you change `packages/core` or `packages/ui`, rebuild them while the server is running:

```bash
pnpm build:core
pnpm build:ui
```

Changes inside `apps/playground/src` use Vite HMR.

## Pages

| Page | Purpose |
|---|---|
| `/search.html?q=rust+async` | Mock Google-style search page |
| `/article.html` | Long-form content page for selection testing |
| `/palette.html` | Palette workbench with query/category controls |

## What to test

- `Alt+J` or the floating Derecherche button opens the Palette.
- On the search page, query extraction uses a simulated Google URL.
- On the article page, select text to show the demo SelectionBar.
- In the Palette: type to filter, `↑/↓` move, `Enter` open, `→` enter a category, `←` go back, `Esc` close.
- `Alt+1`–`Alt+9` quick-pick the nth stable item. Plain digits are reserved for filtering.

## Production vs playground

This harness mounts the UI directly as an ES module. Phase 1 later adds the real userscript build (`vite-plugin-monkey`) and a compatibility page that installs the built `.user.js` in a userscript manager. The Palette UI is developed here first.
