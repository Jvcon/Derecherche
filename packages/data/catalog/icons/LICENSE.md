# Icon license and provenance

Provider icons are generated from [Simple Icons](https://simpleicons.org/).

- Source: <https://github.com/simple-icons/simple-icons>
- License: **CC0 1.0 Universal**
- Mapping: [`simple-icons.yaml`](simple-icons.yaml)
- Generated sprite: `packages/data/generated/icons.svg`
- Generated manifest: `packages/data/generated/icons.json`

Brand names and logos are trademarks of their respective owners. Derecherche uses the icons nominatively to identify search providers. Inclusion does not imply endorsement or affiliation.

Providers without a Simple Icons mapping use a generated letter mark at runtime. No remote favicon requests and no base64 icon data are used.

The icon paths are bundled at build time. The build script fails if a mapped slug does not exist in the installed Simple Icons version, or if a mapping references an unknown provider.
