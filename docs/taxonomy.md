# Taxonomy

Canonical data: [`packages/data/catalog/categories.yaml`](../packages/data/catalog/categories.yaml).

## Principles

- Navigate by user intent, not by website genre.
- At most two category levels: `category -> subcategory`.
- An engine has exactly one primary category.
- Cross-category discovery uses `tags` and `aliases`, not duplicate category membership.
- Provider is metadata and a display grouping, never a navigation level.
- Aim for at least three engines before a subcategory becomes visible.
- Phase 0 may keep planned subcategories as placeholders; empty branches are hidden by the UI.
- Category ids are stable. Display names may change.

## Top-level categories

| Category | id | Scope |
|---|---|---|
| 网页 | `web` | General web search, news, meta-search |
| 知识 | `knowledge` | Encyclopedia, Q&A, dictionary, translation, tutorials |
| 学术 | `academic` | Scholarly search, papers, citations, research data |
| 开发 | `development` | Code hosting, docs/API, packages, debugging, playgrounds |
| 设计 | `design` | Inspiration, portfolios, color, design tutorials |
| 素材 | `assets` | Templates, vectors, icons, fonts, clips, sound effects |
| 图片 | `image` | Image search, wallpapers, stock photos |
| 影音 | `media` | Video, music, audio/podcasts, live streams |
| 购物 | `shopping` | Marketplaces, price comparison, second-hand, design goods |
| 社区 | `community` | General communities, tech communities, Q&A, forums |
| 生活 | `life` | Maps/travel, food, health, government, travel |
| 工具 | `tools` | Downloads, converters, online tools, cloud storage |

## Legacy mapping

| Old category | New home |
|---|---|
| Web | `web` |
| Translate | `knowledge / knowledge-translate` |
| Knowledge | `knowledge` |
| Development | `development` |
| Video | `media / media-video` |
| Picture | `image` |
| Material | `assets` |
| Instruction | split into `knowledge / knowledge-howto`, `design / design-tutorial`, `development / dev-docs` |
| Music | `media / media-music` |
| Life | `life` |
| Social | `community` |
| Shopping | `shopping` |
| Scholar | `academic` |

`Instruction` is no longer a top-level category because it describes an intent, not a resource type, and overlaps with knowledge, documentation, and design tutorials.

## Examples

```text
学术
├─ 学术搜索
│  ├─ Google Scholar
│  ├─ ResearchIndex
│  └─ Semantic Scholar
├─ 论文库
│  ├─ arXiv
│  └─ 中国知网
├─ 引用/预印本
└─ 学术数据
```

```text
开发
├─ 代码托管
│  └─ GitHub
├─ 文档/API
│  └─ MDN Web Docs
├─ 包管理
│  ├─ npm
│  ├─ PyPI
│  └─ crates.io
└─ 排错/问答
   └─ Stack Overflow
```

## Adding or changing categories

1. Edit `categories.yaml`.
2. Keep ids stable; change display names instead of renaming ids.
3. Add aliases for search and discovery.
4. Move engines by changing their primary `category`.
5. Run `pnpm data:validate`.
6. Update this document if the top-level structure changes.
