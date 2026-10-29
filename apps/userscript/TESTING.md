# Userscript test build

This is the install and verification checklist for #66. The test build is not a
release artifact and is intentionally kept out of git.

## Build

```bash
pnpm build:userscript:test
```

Output:

```text
apps/userscript/dist/derecherche-test.user.js
```

`dist/` is ignored by git. The build script verifies the metadata block, the
test name/version, GM storage grants, every adapter `@match`, InlineBar presence,
and the size budget before reporting success.

The test build is named:

```text
Derecherche (test)
@version 0.1.0-test.<timestamp>
```

That makes it distinguishable from a production install in Tampermonkey or
Violentmonkey.

## Automated checks

```bash
pnpm --filter @derecherche/userscript test
```

The smoke test evaluates the built bundle in `happy-dom` and checks:

- metadata and every `@match` host
- Google mounting at `#search` with `insert: before`
- Baidu mounting after `#head`
- SPA query changes reuse one InlineBar
- unmatched pages do not mount
- file size budget

To test the test artifact specifically:

```bash
cd apps/userscript
DERECHERCHE_BUNDLE=derecherche-test.user.js node --test test/*.test.mjs
```

## Install

### Tampermonkey / Violentmonkey

1. Build the test artifact.
2. Open the extension dashboard.
3. Create a new script.
4. Paste the entire `apps/userscript/dist/derecherche-test.user.js`.
5. Save and confirm the script is enabled.
6. Visit a supported result page.

### qutebrowser

1. Build the test artifact.
2. Add the script to the qutebrowser Greasemonkey script directory, or use the
   qutebrowser `:greasemonkey-reload` command after placing it there.
3. Restart or reload qutebrowser.
4. Visit a supported result page.

The script does not use `GM_registerMenuCommand`.

## Manual test matrix

| Area | Check | Status |
|---|---|---|
| Install | Tampermonkey accepts the script | Pending manual |
| Install | Violentmonkey accepts the script | Pending manual |
| Install | qutebrowser loads the script | Pending manual |
| Google | InlineBar appears below the search header | Pending live DOM |
| Bing | InlineBar appears below `#b_header` | Live selectors verified; browser pending |
| Baidu | InlineBar appears below `#head` | Pending live DOM |
| Query | InlineBar uses the current search query | Automated pass |
| Click | Plain click opens in the current tab | Automated callback pass |
| Click | `Ctrl` / `Cmd` + click opens a new tab | Automated callback pass |
| Click | Middle click opens a new tab | Automated callback pass |
| More | Palette opens with query and category | Automated callback pass |
| SPA | New query reuses one InlineBar | Automated pass |
| Storage | Frecency survives reload | Pending manual |
| Debug | `?derecherche-debug=1` logs the adapter | Pending manual |
| Layout | Host page search header is not broken | Pending manual |
| Uninstall | Removing the script removes the bar after reload | Pending manual |

## Live adapter verification

Checked on 2026-10-29:

| Adapter | Live check | Result |
|---|---|---|
| Bing | Fetched live result HTML for `www.bing.com` and `cn.bing.com` | Selectors `#b_header`, `#sb_form_q`, `#b_results` present |
| Google | Automated fetch returned a JS/unsupported-browser shell | Manual browser check required |
| Baidu | Automated fetch returned the Baidu security-verification page | Manual browser check required |
| Others | Not checked live | Contract fixtures only |

Contract fixtures prove resolver and insertion behavior, not current live DOM.
Refresh a fixture from a real page whenever an adapter breaks.

## Debugging

Add `?derecherche-debug=1` to a result URL. In DevTools, inspect:

```html
<div
  id="derecherche-inline-bar"
  data-derecherche-site="google"
  data-derecherche-mount="search"
  data-derecherche-insert="before"
></div>
```

Meanings:

- `data-derecherche-site`: matched site adapter
- `data-derecherche-mount`: resolved container id/class/tag
- `data-derecherche-insert`: `before`, `after`, `prepend`, or `append`
- `data-derecherche-status`: `rendered` after a successful render
- `data-derecherche-engines`: number of rendered engine buttons

If the InlineBar is missing:

1. Check that the page has a non-empty query.
2. Check `data-derecherche-site`; no attribute means no adapter matched.
3. Check the console for `[Derecherche] no mount target`.
4. Paste the page HTML into `/adapters.html` and inspect the attempted selectors.

## Known limitations

- SelectionBar is not included.
- No settings drawer, engine overrides, custom engines, or import/export.
- No background-tab open mode.
- Mobile Baidu is not covered by the `baidu` adapter.
- Google and Baidu live selectors still need a real browser check.
- The test build is not published to GreasyFork.

## Privacy

- The catalog and icons are bundled; no network request fetches catalog data.
- Frecency is stored locally through GM storage when both GM storage functions
  are available, otherwise `localStorage`.
- Frecency is never uploaded.
- Clicking an engine navigates to that engine's normal search URL.

## Uninstall

Remove the script from the userscript manager and reload the page. The host
element id is `derecherche-inline-bar`.
