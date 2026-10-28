# Icons

Provider icons are generated from [Simple Icons](https://simpleicons.org/) at build time.

## Source of truth

- Provider to slug mapping: [`simple-icons.yaml`](simple-icons.yaml)
- License and provenance: [`LICENSE.md`](LICENSE.md)

## Build output

`pnpm data:build` produces:

- `packages/data/generated/icons.svg` — sprite with one `<symbol>` per mapped provider
- `packages/data/generated/icons.json` — manifest with symbol ids, source, license, and missing providers

## Rules

- Do not add remote favicon URLs.
- Do not add base64 icon data to engine records.
- Do not add a logo without recording its source and license.
- Providers without a mapping fall back to a generated letter mark.
- A mapped slug must exist in the installed `simple-icons` package, or the build fails.
- Do not map a provider to a different brand just to avoid a fallback.

## Current coverage

The first pass maps 38 providers. Thirty providers use the letter-mark fallback because Simple Icons does not carry their brand.
