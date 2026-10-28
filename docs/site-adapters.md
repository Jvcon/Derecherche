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
    - container: '#search'
      insert: before
    - container: '#gb'
      insert: after
    - anchor: ['#tsf', 'form[action*="/search"]', 'input[name="q"]']
      insert: after
```

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
  data-derecherche-mount="search"
  data-derecherche-insert="before"
></div>
```

These attributes record the adapter, resolved target, and insert direction.

## Contract fixtures are not live proof

Fixtures protect the resolver and the UI against regressions. Search sites change
their DOM regularly. A fixture must be refreshed from a real page when an adapter
is reported broken, and the live result should be verified before closing the
adapter issue.
