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
| Google | InlineBar appears directly below the search bar, above the tabs | Playwright: real SERP mounts `#main` before, coverage 9/9; later runs hit HTTP 429 |
| Bing | InlineBar appears below `#b_header` | Playwright pass (coverage 9/9); cn.bing.com falls back to anchor-after-`#sb_form` |
| Baidu | InlineBar appears below the fixed `#head` | Live pass on a real SERP: bar top=71, `#s_tab` padding-top 0, tabs directly below the bar; offline fixture also passes (coverage 9/9) |
| Query | InlineBar uses the current search query | Playwright pass (engine URL carries live-query) |
| Click | Plain click opens in the current tab | Playwright pass (11 sites incl. cross-engine navigation) |
| Click | `Ctrl` / `Cmd` + click opens a new tab | Automated callback pass |
| Click | Middle click opens a new tab | Automated callback pass |
| More | Palette opens with query and category | Automated callback pass |
| SPA | New query reuses one InlineBar | Automated pass |
| Storage | Frecency survives reload | Playwright pass (localStorage fallback writes on all mounted hosts) |
| Debug | `?derecherche-debug=1` logs the adapter | Pending manual |
| Layout | Host page search header is not broken | Playwright pass (coverage 9/9 on bing, cn.bing, google, duckduckgo, wikipedia, github, youtube, bilibili) |
| Layout | Fixed header does not cover the bar | Live Baidu pass (`offset=71`) and offline fixture pass |
| Layout | Fixed-header compensation does not leave a gap | Live Baidu pass (`#s_tab` padding-top 0) |
| Scroll | Bar docks below the header and stays visible | Playwright pass: Google 73, YouTube 56, Bilibili 64, Wikipedia 0, GitHub 48, Bing 0, DDG 0, Baidu 70 |
| Scroll | Bar returns to flow at the top | Playwright pass (all docked sites) |
| Layout | Side drawer does not cover the bar | Playwright pass (YouTube `inset=240/0`) |
| Uninstall | Removing the script removes the bar after reload | Pending manual |

## Live browser test (Playwright)

`apps/browser-test/live.mjs` evaluates the built bundle at document-idle
(like a userscript manager; GM_* absent, so the localStorage fallback is
exercised) on real result pages. CSP headers are stripped in transit because
page CSPs block `eval`, which real userscript managers are exempt from.

```bash
cd apps/browser-test && node live.mjs           # all sites
node live.mjs bing github                        # subset
HEADFUL=1 node live.mjs google                   # visual debug
```

Verified per site: adapter match, mount container/insert rule, shadow-root
engine buttons, `status=rendered`, visibility geometry, a 3x3
`elementFromPoint` coverage test, first-engine click navigation, query carried
into the engine URL, and frecency persistence. Coverage is reported as
`hits/points`; `9/9` means no header, sidebar, or page content covered any part
of the bar.

Checked 2026-10-29 from a datacenter IP:

| Site | Result |
|---|---|
| google (`gbv=1`) | Real SERP mounted `#main` before (directly below the search bar); coverage 9/9; docks at 73; later captcha/429 runs mount the shell. Click + query + frecency pass |
| bing | Mounted `#b_header` after; coverage 9/9; docks at 0; click + query + frecency pass |
| cn.bing | Mounted via anchor fallback after `#sb_form` (`#b_header` absent on served variant); coverage 9/9; click + query + frecency pass |
| duckduckgo | Mounted `#header_wrapper` after; coverage 9/9; docks at 0; right AI panel inset `0/303` on that variant; click + query + frecency pass |
| wikipedia | Mounted `header` after and relocated to its own row; coverage 9/9; docks at 0; click + query + frecency pass |
| github | Mounted the header after; coverage 9/9; docks at 48; click + query + frecency pass |
| youtube | Mounted `#masthead-container` after; left guide inset `240/0`; coverage 9/9; docks at 56; click + query + frecency pass |
| bilibili | Mounted after `.search-header`; coverage 9/9; docks at 64; click + query + frecency pass |
| google-scholar | Blocked: HTTP 403 "Sorry" bot page |
| brave | Blocked: HTTP 429 captcha |
| baidu | Live SERP mounted: bar top=71, `offset=71`, `#s_tab` padding-top=0, tabs start at 122; docks at 70 and returns to flow. Other runs were blocked by 百度安全验证. Offline fixture passes with coverage 9/9 |
| zhihu | Blocked: HTTP 403 安全验证 |

The four blocked hosts need a check from a residential IP or a manual
browser; the bot-wall responses never reach a real SERP, so adapter
selectors there remain fixture-verified only.

### Offline fixture layout test

```bash
cd apps/browser-test
node fixtures.mjs
```

Every `fixtures/<site>/mount.html` is served at its real adapter URL, the test
bundle is injected, and the bar must render, stay in the viewport, and pass the
same 3x3 coverage test. This has no network dependency and covers blocked
sites. Current result: 13/13 fixtures pass.

The Baidu fixture models the real fixed header and its `#s_tab` compensation:

```text
bar top=71, fixed header bottom=70, offset=71, #s_tab padding-top=0, coverage=9/9
docked at 70 while scrolled, coverage 9/9, restored to flow at the top
```

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
  data-derecherche-mount="rcnt"
  data-derecherche-insert="before"
  data-derecherche-status="rendered"
  data-derecherche-engines="6"
  data-derecherche-offset="0"
></div>
```

Meanings:

- `data-derecherche-site`: matched site adapter
- `data-derecherche-mount`: resolved container id/class/tag
- `data-derecherche-insert`: `before`, `after`, `prepend`, or `append`
- `data-derecherche-status`: `rendered` after a successful render
- `data-derecherche-engines`: number of rendered engine buttons
- `data-derecherche-offset`: transparent top padding used to clear a header
- `data-derecherche-inset`: left/right inset used to clear a side panel
- `data-derecherche-relocated`: `flex` when moved out of a flex/grid header row
- `data-derecherche-docked`: `true` while the bar is fixed below the header

`mount.trim` selectors are reset to `padding-top: 0` while the bar is mounted
and restored when it is destroyed.

## Scrolling behavior

The InlineBar starts in normal flow. When its natural position reaches the
bottom of the current fixed/sticky header, it switches to `position: fixed`
just below that header, so it stays visible while scrolling. A hidden
placeholder preserves the original flow space. Scrolling back above the dock
point restores the in-flow row and removes the placeholder.

The dock top is re-measured while scrolling, so pages that collapse or expand
their header (Baidu) and pages that turn a static header into a fixed one
(Google, Bilibili) keep the bar below the current header. Fixed side panels
remain outside the bar through left/right insets.

If the InlineBar is missing:

1. Check that the page has a non-empty query.
2. Check `data-derecherche-site`; no attribute means no adapter matched.
3. Check the console for `[Derecherche] no mount target`.
4. Paste the page HTML into `/adapters.html` and inspect the attempted selectors.

## Known limitations

- The InlineBar is an in-page row at rest and docks below the search header
  while scrolling. The docked bar overlays page content by design.
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
