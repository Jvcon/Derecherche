# Fixtures

Site fixtures for the Derecherche core adapter tests. Tests run entirely offline.

## Layout

```text
fixtures/
└─ <site-id>/
   ├─ url.txt          # URL with the query
   ├─ page.html        # minimal HTML snapshot for query extraction
   ├─ expected.json    # siteId, query, url, htmlUrl
   ├─ mount.html       # saved header/container DOM for insertion tests
   └─ mount.json       # expected mount selector, insert mode, and fallback cases
```

The fixture name must match the site adapter id in `packages/data/catalog/sites/`.

## Update workflow

1. Change the site adapter or encounter a regression.
2. Update the minimal HTML and URL in the matching fixture.
3. Keep only the DOM needed for the query input; do not commit full pages or private data.
4. Run:
   ```bash
   pnpm --filter @derecherche/core test
   ```
5. If adding a site adapter, add a fixture directory with the same id.

## Scope

Each fixture is exercised in three modes:

- URL-only: query comes from the site adapter's URL params.
- HTML snapshot: query comes from the `value` attribute of the parsed input.
- Live DOM: query comes from the input's `value` property.

The standard test query is `rust async` to cover whitespace normalization.

## Mount fixtures

`mount.html` contains the narrow DOM needed to resolve the InlineBar insertion
point: the search header, the results container, and the query input. It is not
a full page snapshot.

`mount.json` describes one or more cases:

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
    }
  ]
}
```

The UI test suite removes `remove` selectors, resolves the mount, mounts the real
InlineBar, and asserts the resolved selector plus the actual sibling/parent
position. See [`docs/site-adapters.md`](../docs/site-adapters.md).

Mount fixtures are contract snapshots, not live proof. Refresh them from a real
page when an adapter breaks.
