# Fixtures

Site fixtures for the Derecherche core adapter tests. Tests run entirely offline.

## Layout

```text
fixtures/
└─ <site-id>/
   ├─ url.txt          # URL with the query
   ├─ page.html        # minimal HTML snapshot
   └─ expected.json    # siteId, query, url, htmlUrl
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
