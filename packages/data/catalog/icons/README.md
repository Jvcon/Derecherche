# Icons

Phase 0 does not ship icon files yet. The catalog references icons by id; the build will generate a sprite.

Planned rules:

- One SVG per icon id, stored in this directory.
- Engine and category icons are separate namespaces if their ids collide.
- Build step generates a single sprite plus a lookup map.
- No remote favicon requests and no base64 inside engine records.
- Every icon records its source and license in `icons/LICENSE.md`.
- Missing icons fall back to the provider icon, then a generated letter mark.

Suggested layout:

```text
icons/
├─ LICENSE.md
├─ providers/
│  ├─ google.svg
│  └─ github.svg
└─ categories/
   ├─ web.svg
   └─ academic.svg
```

Do not add brand assets until their license/provenance is confirmed.
