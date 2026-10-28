# Legacy engine migration

Source: `legacy/userscript/template.js`.

## Summary

- Legacy base engines found: 98
- Migrated: 40
- Merged into existing catalog entries: 23
- Skipped: 35
- Optional `engineList_plus` packs were inventoried separately and are not part of this migration.

The migration is curated rather than a blind port. Dead engines, policy-problematic downloads, old HTTP endpoints, and duplicates were not added as active entries. New records include a `legacyId` of `<legacy category>:<legacy index>`.

## Migrated

| Legacy id | Legacy name | New engine | New category |
|---|---|---|---|
| image:3 | pixiv | Pixiv (`pixiv`) | image-search |
| image:4 | flickr | Flickr (`flickr`) | image-stock |
| image:5 | 花瓣 | 花瓣 (`huaban`) | design-inspiration |
| knowledge:3 | 百度文库 | 百度文库 (`baidu-wenku`) | knowledge-howto |
| knowledge:4 | 豆丁文档 | 豆丁文档 (`docin`) | knowledge-howto |
| knowledge:6 | 萌娘百科 | 萌娘百科 (`moegirl`) | knowledge-encyclopedia |
| knowledge:7 | 果壳 | 果壳 (`guokr`) | knowledge-encyclopedia |
| knowledge:9 | Quora | Quora (`quora`) | knowledge-qa |
| mine:1 | Can I Use | Can I Use (`caniuse`) | dev-docs |
| mine:3 | w3c | W3School (`w3school`) | dev-docs |
| mine:4 | GreasyFork | GreasyFork (`greasyfork`) | tools-online |
| music:0 | 网易音乐 | 网易云音乐 (`netease-music`) | media-music |
| music:4 | QQ音乐 | QQ 音乐 (`qq-music`) | media-music |
| news:1 | 百度新闻 | 百度新闻 (`baidu-news`) | web-news |
| news:6 | CNN | CNN (`cnn`) | web-news |
| news:7 | BBC | BBC (`bbc`) | web-news |
| news:9 | 今日头条 | 今日头条 (`toutiao`) | web-news |
| scholar:1 | 百度学术 | 百度学术 (`baidu-xueshu`) | academic-search |
| scholar:3 | 万方 | 万方数据 (`wanfang`) | academic-papers |
| scholar:6 | JSTOR | JSTOR (`jstor`) | academic-papers |
| scholar:7 | Springer | Springer (`springer`) | academic-papers |
| shopping:2 | 苏宁 | 苏宁 (`suning`) | shopping-general |
| shopping:4 | 天猫 | 天猫 (`tmall`) | shopping-general |
| shopping:6 | 闲鱼 | 闲鱼 (`xianyu`) | shopping-secondhand |
| sociality:1 | 豆瓣 | 豆瓣 (`douban`) | community-general |
| sociality:2 | 百度贴吧 | 百度贴吧 (`tieba`) | community-general |
| sociality:4 | 新浪微博 | 微博 (`weibo`) | community-general |
| translate:1 | 百度翻译 | 百度翻译 (`baidu-translate`) | knowledge-translate |
| translate:2 | 有道词典 | 有道词典 (`youdao-dict`) | knowledge-dictionary |
| translate:3 | 必应翻译 | Bing 词典 (`bing-dict`) | knowledge-dictionary |
| translate:4 | Forvo发音 | Forvo (`forvo`) | knowledge-dictionary |
| translate:6 | 汉典 | 汉典 (`zdic`) | knowledge-dictionary |
| video:2 | 优酷 | 优酷 (`youku`) | media-video |
| video:3 | 腾讯视频 | 腾讯视频 (`tencent-video`) | media-video |
| video:4 | acfan | AcFun (`acfun`) | media-video |
| video:7 | niconico | ニコニコ (`niconico`) | media-video |
| video:8 | 爱奇艺 | 爱奇艺 (`iqiyi`) | media-video |
| web:4 | 360 | 360 搜索 (`so360-web`) | web-general |
| web:5 | yahoo | Yahoo (`yahoo-web`) | web-general |
| web:6 | 搜狗 | 搜狗 (`sogou-web`) | web-general |

## Merged into existing entries

| Legacy id | Legacy name | Existing engine |
|---|---|---|
| image:0 | 谷歌图片 | Google Images (`google-images`) |
| image:1 | 百度图片 | 百度图片 (`baidu-images`) |
| image:2 | 必应图片 | Bing Images (`bing-images`) |
| image:7 | Pinterest | Pinterest (`pinterest`) |
| knowledge:0 | 知乎 | 知乎 (`zhihu-search`) |
| knowledge:1 | 维基 | 维基百科（中文） (`wikipedia-zh`) |
| knowledge:2 | 百度百科 | 百度百科 (`baidu-baike`) |
| knowledge:10 | stackoverflow | Stack Overflow (`stackoverflow`) |
| mine:0 | MDN | MDN Web Docs (`mdn`) |
| mine:2 | GitHub | GitHub (`github`) |
| news:0 | 谷歌中文 | Google News (`google-news`) |
| scholar:0 | 谷歌学术 | Google Scholar (`google-scholar`) |
| scholar:2 | 知网 | 中国知网 (`cnki`) |
| shopping:0 | 淘宝 | 淘宝 (`taobao`) |
| shopping:1 | 京东 | 京东 (`jd`) |
| shopping:3 | 亚马逊 | Amazon (`amazon`) |
| translate:0 | 谷歌翻译 | Google Translate (`google-translate`) |
| video:0 | youtube | YouTube (`youtube`) |
| video:1 | bilibili | 哔哩哔哩 (`bilibili`) |
| web:0 | Google | Google (`google-web`) |
| web:1 | 百度 | 百度 (`baidu-web`) |
| web:2 | 必应 | Bing (`bing-web`) |
| web:3 | DDG | DuckDuckGo (`duckduckgo-web`) |

## Skipped

| Legacy id | Name | Reason |
|---|---|---|
| download:0 | BTSOW | download/piracy scope not migrated |
| download:1 | 谷歌搜索 | legacy custom Google CSE for downloads; not re-verified |
| download:2 | 动漫花园 | download/piracy scope not migrated |
| download:3 | 海盗湾 | download/piracy scope not migrated |
| download:4 | veryCD | download/piracy scope not migrated |
| download:5 | ED2000 | download/piracy scope not migrated |
| download:6 | 人人影视 | download/piracy scope not migrated |
| download:7 | subHD字幕 | download/piracy scope not migrated |
| image:6 | easyicon | obsolete or dead |
| knowledge:5 | 爱问知识 | disabled in legacy defaults and not migrated |
| knowledge:8 | 知乎(搜狗) | disabled in legacy defaults and not migrated |
| mine:5 | 人生05电影 | download/movie scope not migrated |
| mine:6 | 射手网(伪) | download/subtitle scope not migrated |
| mine:7 | 游戏-3dm | download/game scope not migrated |
| music:1 | 一听 | obsolete or dead |
| music:2 | 虾米音乐 | obsolete or dead |
| music:3 | 音悦Tai | obsolete or dead |
| music:5 | 百度音乐 | obsolete or dead |
| news:2 | 网易-百度 | site-specific Baidu query; better represented by a site adapter |
| news:3 | 网易-谷歌 | site-specific Google query; better represented by a site adapter |
| news:4 | 腾讯新闻 | site-specific Sogou query; better represented by a site adapter |
| news:5 | 凤凰新闻 | legacy HTTP URL not re-verified |
| news:8 | Economis | site-specific Google query; better represented by a site adapter |
| scholar:4 | EBSCO | legacy HTTP URL not re-verified |
| scholar:5 | WOS | legacy HTTP URL not re-verified |
| shopping:5 | 1号店 | obsolete or dead |
| sociality:0 | Twitter | login-gated; not selected |
| sociality:3 | 腾讯微博 | obsolete or dead |
| sociality:5 | Facebook | login-gated; not selected |
| sociality:6 | Google+ | obsolete or dead |
| sociality:7 | 微信搜索 | legacy HTTP URL not re-verified |
| translate:5 | CNKI翻译 | disabled in legacy defaults and not migrated |
| translate:7 | 海词 | legacy HTTP URL not re-verified |
| video:5 | 乐视 | obsolete or dead |
| video:6 | 搜狐 | obsolete or dead |

## Notes

- Existing catalog entries were not rewritten during this pass.
- Migrated records are grouped in `packages/data/catalog/engines/legacy.yaml` for review.
- URLs that were clearly retired were replaced with current endpoints; the original category and index are preserved in `legacyId`.
- Optional `engineList_plus` packs (app stores, ebooks, net disks) remain out of scope until their URLs are reviewed.

