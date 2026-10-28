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
- Input is empty: the Result Panel shows the configured common engines.
- Typing filters the engine list and switches to Results mode.
- `TAB`: enter category mode from the common/filter list. In category mode, `TAB` drills into the highlighted category.
- `Enter`: open the current engine, or enter a highlighted category.
- On an engine row, `TAB` is disabled; the status bar shows the disabled hint.
- `⌘K` / `Ctrl+K`: open the action menu for an engine (copy URL, open current tab, edit query).
- `↑/↓` move, `←` go back, `Esc` close.
- `Alt+1`–`Alt+9` quick-pick the nth stable item. Plain digits are reserved for filtering.

The UI is intentionally three rows: input bar, result panel, and status bar. The status bar keeps the Raycast-style hints visible: `Select Category TAB`, `Open Enter`, `Action ⌘K`.

## Production vs playground

This harness mounts the UI directly as an ES module. Phase 1 later adds the real userscript build (`vite-plugin-monkey`) and a compatibility page that installs the built `.user.js` in a userscript manager. The Palette UI is developed here first.
