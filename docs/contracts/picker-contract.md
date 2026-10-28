# Picker interaction contract

Status: Phase 0 contract. This document defines behavior, not implementation.

Canonical data schemas live in [`packages/data/schema/`](../../packages/data/schema/).

## 1. Terms

| Term | Meaning |
|---|---|
| **Context** | What the picker was opened from: page query, selected text, or manual input |
| **Query** | The text that will be sent to the target engine |
| **Provider** | A brand or operator, e.g. Google, Bing, GitHub |
| **Engine** | A concrete search target with a URL template, e.g. Google Scholar |
| **Category** | A resource type, e.g. 学术 / 学术搜索 |
| **Stable list** | The user-visible, deterministic engine order |
| **Recommendation head** | Up to three dynamic engines merged into the head of the single list |
| **InlineBar** | The ambient bar anchored near the page search box |
| **SelectionBar** | The floating bar shown after text selection |
| **Palette** | The full keyboard-first picker |

## 2. One picker, three surfaces

All three surfaces share the same query, category path, engine catalog, order, and icons.

```text
EnginePicker
├─ InlineBar      (page context, ambient)
├─ SelectionBar   (selection context, ephemeral)
└─ Palette        (full keyboard UI)
```

Rules:

- InlineBar and SelectionBar are compact projections of the same picker model.
- "More" on either bar opens Palette with the same context and category.
- No surface may maintain its own engine order.

## 3. Query extraction

### 3.1 Search box

Site adapter selection: the most specific adapter wins. A host-only match is the fallback; an adapter with `pathPattern` and/or `paramMatches` takes precedence. Ties are resolved by `priority` (higher wins), then by exact host over wildcard. For example, Google Images matches `www.google.com` + `/search` + `tbm=isch`, while Google Web matches the same host without those constraints.

Priority:

1. Site adapter URL parameters, in declared order.
2. Live search input value (`.value`) from the site adapter selectors.
3. HTML snapshot value, when only a static snapshot is available.
4. Manual input.

The query is updated when:

- the search input emits `input` / `change`;
- the page URL changes via SPA navigation;
- the adapter is re-matched after navigation.

If the query is empty, InlineBar is hidden.

### 3.2 Selected text

- Source: `window.getSelection()?.toString()`.
- Trim and collapse whitespace.
- Ignore selections inside `input`, `textarea`, `contenteditable`, and password fields.
- Ignore selections inside Derecherche UI.
- Ignore selections shorter than 2 characters.
- Keep the full query; truncate only the displayed label.

## 4. Category navigation

- At most two category levels: `category -> subcategory`.
- Engines may be attached to either level.
- Entering a category shows child categories first, then engines directly attached to that category.
- Provider is not a navigation level. Provider grouping may appear inside a category list.
- Breadcrumb is always visible in Palette, e.g. `全部 / 学术 / 学术搜索`.
- Typing filters globally across all categories. The current category only determines the default browsing scope.
- Categories with no engines and no children are hidden.

### 4.1 Keyboard

| Key | Action |
|---|---|
| Type | Filter within the current scope |
| `Up` / `Down` | Move highlight in the visible list |
| `Enter` | Open the highlighted engine |
| `Tab` | Enter category mode, or append the highlighted category to the token trail |
| `Left` / `Backspace` (empty filter) | Go up one category level; at the root, return to keyword editing |
| `Alt+1`–`Alt+9` | Select the nth visible list item |
| `Alt+L` | Open the floating action menu |
| `Alt+C` | Copy the target URL |
| `Alt+Enter` | Open in the current tab |
| `Esc` | Close |

Digit keys remain available for filtering; quick-pick uses `Alt` plus a digit. Category mode is entered with `Tab`; `Tab` on an engine row is disabled.

## 5. Recommendation

Recommendation is a head, not a second list.

- There is one deduplicated list. Pinned engines come first, then up to three recommended engines, then the remaining stable list.
- The stable tail order is catalog `order` plus user overrides. It does not change based on query or usage.
- Recommendation candidates are non-pinned engines from the current scope and filter result.
- At most three recommendations are selected, with at most one engine per provider.
- Recommended rows carry a `✦` marker; there is no separate group heading.
- `Alt+1`–`Alt+9` bind to the whole visible list, including the recommendation head.
- Query mode recommends from all active engines and keeps common engines as the stable base.
- Category mode recommends only inside the active category scope and current filter.
- Frecency, site affinity, query intent, and category affinity influence the head, never the stable tail.

Recommended scoring inputs:

```text
frecency
query intent / trigger words
category affinity
```

Scoring must be local, deterministic, and testable. No network calls. Frecency is supplied by the host and never uploaded.

## 6. InlineBar

- Appears only on a matched result page with a non-empty query.
- Does not appear on search home pages or pages without a query.
- Uses the site adapter's `mount.container` when present, otherwise inserts a full-width row after the anchor's header/form.
- Shows up to six engines from the same `buildRankedList` result as Palette, including the `✦` recommendation head.
- Current category defaults to the site adapter's `defaultCategory`.
- Plain click switches the current tab to the target engine and searches the same query.
- `Ctrl` + click opens a new tab; `Cmd` + click is accepted on macOS. Middle click also opens a new tab.
- `More` opens Palette with the same query and category.
- Must be idempotent across SPA navigation: remove the previous instance before mounting a new one.
- Must not break the host page layout.
- Is independent of SelectionBar: the two may coexist and neither hides the other.

## 7. SelectionBar

- Appears automatically after a text selection.
- Debounce: 150–250 ms.
- Position above the selection when space allows, otherwise below.
- Gap: 8 px from the selection.
- Does not steal focus.
- Does not capture global number keys. Number keys work only after the bar or Palette receives focus.
- Hides on scroll, resize, selection loss, `Esc`, or outside click.
- Shows the current category's top 4 engines and `More`.
- Coexists with InlineBar; it does not hide it.
- May be disabled per host and in editable or sensitive contexts.

## 8. Open modes

Default: new tab.

| Host | New tab | Current tab | Background tab |
|---|---|---|---|
| Tampermonkey / Violentmonkey | `GM_openInTab(url, { active: true })` | `location.href = url` | `GM_openInTab(url, { active: false })` |
| qutebrowser Greasemonkey | `GM_openInTab(url)` | `location.href = url` | fallback to new tab |
| Extension | `browser.tabs.create({ url, active: true })` | `browser.tabs.update({ url })` | `browser.tabs.create({ url, active: false })` |
| CLI / qutebrowser Phase 3 | `open -t URL` | `open URL` | `open -b URL` |
| fzf / system launcher | `xdg-open` / launcher open | not applicable | not applicable |

All host implementations must expose the same `open(url, { active })` contract.

## 9. Host capabilities

| Host | URL | Live DOM | HTML snapshot | Selection | Clipboard |
|---|---|---|---|---|---|
| Userscript | yes | yes | yes | yes | yes |
| Extension | yes | yes | yes | yes | yes |
| qutebrowser `--userscript` | yes | no | yes | yes | yes |
| fzf | yes | no | optional | yes | yes |
| Noctalia / DMS | yes | no | no | host-dependent | host-dependent |

Core resolution must not assume live DOM. Site adapters declare capabilities explicitly.

## 10. Data contract

- `category` is a single primary category per engine.
- Cross-category discovery uses `tags` and `aliases`, not duplicate category membership.
- Provider is metadata only; it must not create a navigation level.
- URL templates use `{q}` and must be `http` or `https`.
- Icons are referenced by id and shipped as a sprite; no base64 in catalog entries.
- User overrides are stored separately from the bundled catalog.
- The bundled catalog is read-only.

## 11. Acceptance criteria

- Keyboard-only flow works: open Palette, switch category, drill down, filter, open a new tab.
- `Alt+1`–`Alt+9` map to the visible list, including the recommendation head. Plain digits remain usable for filtering.
- InlineBar appears on matched result pages with a non-empty query without breaking layout.
- InlineBar opens in the current tab on plain click and in a new tab on `Ctrl`/`Cmd` + click.
- InlineBar does not duplicate after SPA navigation.
- SelectionBar does not appear in inputs, does not steal focus, and hides on scroll.
- InlineBar and SelectionBar can appear at the same time.
- The same engine order and category state are visible across all three surfaces.
- Core can resolve a URL and build a target URL in Node without a DOM.
