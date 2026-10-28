# Legal and provenance

Derecherche is licensed under **GPL-3.0-only**. See [`LICENSE`](../LICENSE).

This document records the provenance of the code, data, and icons. It is not legal advice.

## Project license

- SPDX identifier: `GPL-3.0-only`
- The runtime, build scripts, schemas, and curated catalog are distributed under GPL-3.0-only.
- Contributions are accepted under the same license.

## Legacy code audit

### `searchEngineJump`

The upstream `searchEngineJump` repository snapshot under `legacy/reference/` has **no license file**. It is archived for historical reference only.

- It is not imported by `packages/` or `apps/`.
- It is not built, bundled, or shipped.
- Its implementation must not be copied into the new runtime without permission from the copyright holders.

### Derecherche legacy userscripts

The previous Derecherche userscripts under `legacy/userscript/` are archived for reference. They are not part of the build. They may contain code derived from the unlicensed upstream project, so they must not be reused as new runtime code without a separate license review.

### `kiss-translator`

`kiss-translator` is GPL-3.0. It is used as an architectural reference only. No source code from it has been copied into Derecherche. If code is copied in the future, the GPL-3.0 obligations continue to apply.

## Catalog data

Engine names and URLs are factual references. The curated selection, category taxonomy, descriptions, aliases, and extraction rules are part of this project and are distributed under GPL-3.0-only.

Do not add:

- copied descriptions from unlicensed sources;
- scraped content that is not factual metadata;
- icons without a compatible license and recorded provenance;
- download or piracy-oriented engines that conflict with project policy.

## Icons

Provider icons are generated from [Simple Icons](https://simpleicons.org/).

- Simple Icons license: **CC0 1.0 Universal**.
- Source repository: <https://github.com/simple-icons/simple-icons>.
- Brand names and logos are trademarks of their respective owners.
- Icons are used nominatively to identify the corresponding search provider.
- Presence of an icon does not imply endorsement or affiliation.
- Missing icons fall back to a generated letter mark.

See [`packages/data/catalog/icons/LICENSE.md`](../packages/data/catalog/icons/LICENSE.md) for the icon-specific record.

## Build-time dependencies

The catalog build currently uses:

- `ajv` — MIT
- `yaml` — ISC
- `acorn` — MIT
- `simple-icons` — CC0-1.0

These are build-time dependencies; they are not shipped as part of the userscript or extension runtime.

## No warranty

The project is provided under GPL-3.0 without warranty. Third-party services, URLs, and trademarks remain the responsibility of their owners.
