# Site adapters and mount rules

Site adapters describe **where Derecherche is allowed to run** and **where the
InlineBar is inserted**. They are not tied to the target engine: `google-web` is
an engine, while `google` is the adapter for Google result pages.

Engine URL templates (`https://www.google.com/search?q={q}`) are only used to
open a target. Mount configuration belongs to the source page adapter.

## Matching a page

An adapter is selected by `matchSite(url, sites)`:

1. `hosts` must match. Exact hosts beat wildcard hosts. Wildcards use the form
   `*.google.com`.
2. `pathPattern` is a regular expression tested against `url.pathname`.
3. `paramMatches` are exact URL parameter values, applied after the path check.
4. `priority` breaks ties. More specific adapters should set a higher priority.

Example: Google Images and Google Web share a host. Google Images wins only when
both the path and `tbm=isch` match:

```yaml
id: google-images
hosts: ["www.google.com", "google.com", "*.google.com"]
pathPattern: "^/search$"
paramMatches:
  tbm: isch
priority: 20
```

Use the URL match fields for **page identity**. Do not put DOM selectors in
`hosts`, `pathPattern`, or `paramMatches`.

## Mount rules

`mount` has two layers:

- `anchor` and `container` are the simple form: one selector or an ordered
  selector list.
- `rules` is the ordered fallback form. Each rule tries its `container`
  selectors first, then its `anchor` selectors.

```yaml
mount:
  anchor: ['#tsf', 'input[name="q"]']
  rules:
    - container: '#main'
      insert: before
    - container: '#rcnt'
      insert: before
    - container: '#search'
      insert: before
    - container: '#gb'
      insert: after
    - anchor: ['#tsf', 'form[action*="/search"]', 'input[name="q"]']
      insert: after
```

Choose a container that starts below the search box and above the results. On
Google, `#main` before is a body-level full-width row directly below the search
bar and above the tab row. `#rcnt` and `#search` remain fallbacks for variants
without `#main`.

Putting the bar *inside* `#searchform` is intentionally avoided. Google's
`#searchform` is a 52px grid with `overflow: clip` inside a 72px fixed wrapper;
appending a row makes it a narrow grid item and overflows the wrapper, so the
bar overlaps the tab/results area and does not reserve layout space. The
body-level row plus the scroll dock gives the same visual result without
mutating Google's header grid.

### Selector lists

A string or an array of strings is accepted:

```yaml
container: '#search'
container: ['#search', '#rcnt', '#main']
```

Selectors run in order. The first match wins. Invalid selectors are recorded as
diagnostics and skipped.

### `insert`

| Value | DOM operation | Typical use |
|---|---|---|
| `before` | `beforebegin` | Insert above the results container |
| `after` | `afterend` | Insert after a top header |
| `prepend` | `afterbegin` | Insert as the first child |
| `append` | `beforeend` | Insert as the last child |

Default: `after`.

A `container` is used directly. An `anchor` is a last-resort input/header; the
InlineBar lifts it to the nearest `header` / `[role="banner"]` / `form` and inserts
after that block. This keeps the bar on its own row instead of inside a search
box.

### `required`

By default, if every adapter selector misses, Derecherche tries generic
`header` / search-input fallbacks. Set `required: true` when a wrong insertion is
worse than no insertion:

```yaml
mount:
  required: true
  rules:
    - container: '#search'
      insert: before
```

## Layout safeguards

The resolver chooses the insertion point, but the InlineBar also checks the
rendered layout before settling. It stays in normal document flow; these steps
prevent the search header or a fixed sidebar from covering it.

- **Flex/grid header relocation.** If the resolved target's parent is a flex or
  grid container, the host is moved after the outer flex/grid wrapper. This
  keeps the bar on its own row instead of becoming another item in the header
  row (Wikipedia's Vector header, for example).
- **Header clearance.** The bar measures the resolved header block and its
  visible descendants. If the bar overlaps the header (including overflowing
  search boxes), it reserves transparent space above itself with padding, so
  the bar starts below the header without margin collapsing. Adapters can also
  declare `mount.trim` to remove a page's now-redundant top padding (Baidu's
  `#s_tab`).
- **Docked overlay clearance.** Fixed or sticky elements at the top of the
  viewport are measured with `elementFromPoint`. The bar is pushed below them.
  This is what keeps Baidu's `position: fixed` `#head` from covering the bar.
- **Side insets.** Fixed/sticky side panels are detected at the left and right
  edges. The bar receives a matching inset so it does not sit underneath a
  drawer (YouTube's guide).
- **Dock on scroll.** The bar stays in normal flow until its natural top
  reaches the current page-header bottom. It then becomes `position: fixed`
  below that header and a hidden placeholder preserves the original flow
  space. It follows header collapse/expand changes and returns to normal flow
  when scrolled back above the dock point.
- **Late layout.** Search headers often render after `DOMContentLoaded`. The
  InlineBar re-settles on `resize`, a `ResizeObserver`, and a short delayed
  schedule, so late headers and SPA changes are handled.

The host exposes the result for debugging:

```html
<div
  id="derecherche-inline-bar"
  data-derecherche-offset="71"
  data-derecherche-inset="240/0"
  data-derecherche-relocated="flex"
></div>
```

- `data-derecherche-offset`: transparent top padding added to clear a header.
- `data-derecherche-inset`: left/right inset added to clear a side panel.
- `data-derecherche-relocated`: `flex` when the host moved out of a flex/grid
  header row.
- `data-derecherche-docked`: `true` while the bar is fixed below the page
  header; the matching placeholder is `[data-derecherche-placeholder]`.

### `trim`

Some pages reserve space for a fixed header with padding on the first content
row. Baidu gives `#s_tab` a 65px top padding so the tabs clear the fixed
`#head`; once the InlineBar occupies that space, the padding becomes an empty
gap. Declare the compensating elements and the InlineBar flattens their top
padding while mounted:

```yaml
mount:
  trim: ['#s_tab']
```

`trim` accepts a selector or an ordered selector list. The InlineBar applies
`padding-top: 0 !important` inline and restores the previous inline value on
destroy. Use it only for page-level compensation that the mount rule makes
redundant; do not use it to restyle ordinary content.

## Adding a new adapter

1. Add `packages/data/catalog/sites/<id>.yaml`.
2. Set `hosts`, optional `pathPattern`, `paramMatches`, and `priority`.
3. Add `urlParams` and query selectors.
4. Add `mount.rules` in preferred-to-fallback order.
5. Run `pnpm data:validate && pnpm data:build`.
6. Add `fixtures/<id>/mount.html` and `fixtures/<id>/mount.json`.
7. Run `pnpm --filter @derecherche/ui test`.
8. Open `pnpm dev:playground` → `/adapters.html`.

## Verifying insertion

### 1. Fixture test

`fixtures/<id>/mount.html` is a small saved DOM snapshot containing the header,
container, and search input. `mount.json` lists expected cases:

```json
{
  "url": "https://www.google.com/search?q=rust+async",
  "query": "rust async",
  "cases": [
    {
      "name": "results wrapper",
      "remove": [],
      "selector": "#search",
      "insert": "before",
      "kind": "container"
    },
    {
      "name": "top bar fallback",
      "remove": ["#search"],
      "selector": "#gb",
      "insert": "after",
      "kind": "container"
    }
  ]
}
```

The UI test suite reads every fixture, removes `remove` selectors, resolves the
mount, mounts the real InlineBar in `happy-dom`, and asserts:

- the resolved selector, insert mode, and kind;
- the InlineBar is immediately before/after the container;
- only one `#derecherche-inline-bar` exists;
- the bar can be destroyed cleanly.

This catches selector syntax errors, wrong fallback order, wrong insert mode,
and duplicate mounts. It does **not** prove that the selector still exists on the
live site.

### 2. Playground inspector

```bash
pnpm dev:playground
# http://localhost:5173/adapters.html
```

The inspector shows:

- hosts, path regex, parameter matches, and matched adapter;
- the ordered mount rules;
- every attempted selector and whether it matched;
- the expected fixture result and PASS/FAIL;
- a live iframe preview with the InlineBar inserted.

Use the **Paste live page HTML** box to test the current page DOM:

1. Open the real search result page.
2. Run `document.documentElement.outerHTML` in DevTools.
3. Paste the result into the inspector.
4. Run the resolver and compare the selected selector.

### 3. Live userscript check

Add `?derecherche-debug=1` to a search URL. The userscript logs the matched
adapter and any mount failure. The host node id is `derecherche-inline-bar`.

Inspect the host in DevTools:

```html
<div
  id="derecherche-inline-bar"
  data-derecherche-site="google"
  data-derecherche-mount="rcnt"
  data-derecherche-insert="before"
  data-derecherche-status="rendered"
  data-derecherche-engines="6"
  data-derecherche-docked="true"
></div>
```

These attributes record the adapter, resolved target, insert direction, render
status, and engine count. The layout attributes from the previous section are
added after the visibility pass.

### 4. Offline Playwright layout test

```bash
cd apps/browser-test
node fixtures.mjs
```

The script serves every `fixtures/<site>/mount.html` at its real adapter URL,
injects the built userscript, and checks that the bar renders, stays in the
viewport, and passes a 3x3 `elementFromPoint` coverage test. It also reports
the header bottom and any overlap. This is deterministic and does not need
network access, so it can verify fixed-header cases such as Baidu even when the
live site returns a verification page.

## Contract fixtures are not live proof

Fixtures protect the resolver and the UI against regressions. Search sites change
their DOM regularly. A fixture must be refreshed from a real page when an adapter
is reported broken, and the live result should be verified before closing the
adapter issue.
