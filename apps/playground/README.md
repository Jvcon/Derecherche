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
- The extracted keyword is placed in the input bar.
- The Result Panel starts on the configured common engines.
- `TAB`: the keyword becomes a token (`[←] [keyword]`) and the Palette enters category mode.
- In category mode, typing searches based on the entered category path:
  - No category entered (root): global search across all categories and engines.
  - Entered root category: matches its subcategories and engines below them.
  - Entered subcategory: matches engines below it.
- `TAB` on a category enters/appends it to the token trail:
  - `[←] [keyword] [Category 1]`
  - `[←] [keyword] [Category 1 / Category 2]`
- `Enter` opens the current engine or enters a highlighted category.
- `TAB` on an engine row is disabled; the status bar hint is dimmed.
- Click the keyword token or go back at the root to return to keyword editing.
- `⌘K` / `Ctrl+K`: open the action menu for an engine (copy URL, open current tab, edit keyword).
- `↑/↓` move, `←` go back, `Esc` close.
- `Alt+1`–`Alt+9` quick-pick the nth item.

The UI is intentionally three rows: input bar, result panel, and status bar. The status bar keeps the Raycast-style hints visible: `Select Category TAB`, `Open Enter`, `Action ⌘K`.

## Production vs playground

This harness mounts the UI directly as an ES module. Phase 1 later adds the real userscript build (`vite-plugin-monkey`) and a compatibility page that installs the built `.user.js` in a userscript manager. The Palette UI is developed here first.
