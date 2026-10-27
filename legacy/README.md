# Legacy archive

This directory contains the pre-rewrite Derecherche userscript and reference material. Nothing here is built, imported, or shipped by the new project.

## Contents

```text
legacy/
├─ README.legacy.md                 # original project README
├─ userscript/
│  ├─ Derecherche.js                # early base userscript
│  ├─ template.js                   # main userscript template with engine data
│  └─ template_ac.js                # alternate template / engine data
└─ reference/
   ├─ search-reference.html        # captured reference page
   ├─ bookmark.txt                 # large bookmark dump
   ├─ search.txt
   ├─ searchEngineJump.user.js      # upstream userscript snapshot
   ├─ searchengine.txt
   ├─ searchenginejump-nextstage.js
   └─ tmScripts.txt                # large userscript dump
```

## Use

- Read-only reference for engine names, categories, and site-specific extraction ideas.
- Do not import these files from `packages/` or `apps/`.
- Do not copy code from `reference/searchEngineJump.user.js` into the new runtime without checking licensing. The upstream repository has no license file.
- Migrate data deliberately: normalize `%s` to `{q}`, re-check URLs, re-source icons, and review each engine before adding it to `packages/data/catalog/`.

The previous README is preserved as [`README.legacy.md`](README.legacy.md).
