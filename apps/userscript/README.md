# @derecherche/userscript

Single-file userscript build for Tampermonkey, Violentmonkey, and qutebrowser.

## Build

```bash
pnpm build:userscript
# apps/userscript/dist/derecherche.user.js
```

The build:

- reads `packages/data/generated/catalog.json` and generates `@match` entries from every site host;
- bundles `@derecherche/core`, `@derecherche/data`, and `@derecherche/ui`;
- targets ES2019;
- prepends the userscript metadata block after minification.

## Runtime

On a matched search-result page the script:

1. extracts the page query from the URL or search box;
2. resolves the site adapter;
3. resolves the mount target through ordered selectors;
4. mounts the InlineBar;
5. keeps it in sync across SPA navigation.

Plain click opens the target engine in the current tab. `Ctrl` / `Cmd` + click opens a new tab. `More` opens the Palette.

## Debug

Add `?derecherche-debug=1` to the search URL to log the matched adapter and mount failures.

The InlineBar host id is `derecherche-inline-bar`.

## Install

1. Build the script.
2. Open the Tampermonkey/Violentmonkey dashboard and create a new script.
3. Paste `apps/userscript/dist/derecherche.user.js`.
4. Visit a supported search result page, e.g. `https://www.google.com/search?q=rust`.

For qutebrowser, add the built file to the Greasemonkey script directory or use `:greasemonkey-reload`.

## Tests

```bash
pnpm --filter @derecherche/userscript test
```

The smoke test evaluates the built bundle in `happy-dom` and checks Google/Baidu
mounting, SPA reuse, unmatched pages, metadata, every `@match` host, and the size
budget.

## Not yet included

- Settings and common-engine overrides (#53).
- SelectionBar (#52).
- Extension packaging (#56).
