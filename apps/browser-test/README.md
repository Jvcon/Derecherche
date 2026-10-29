# Browser test harness

Playwright checks for the built Derecherche userscript. This is a test tool, not
part of the shipped userscript.

## Setup

```bash
pnpm build:userscript:test
cd apps/browser-test
npm install
npx playwright install chromium
```

The scripts read:

```text
apps/userscript/dist/derecherche-test.user.js
```

That artifact is ignored by git. Override it with `DERECHERCHE_BUNDLE=/path/to/derecherche.user.js`.

## Live search pages

```bash
node live.mjs                    # all configured sites
node live.mjs bing wikipedia     # subset
HEADFUL=1 node live.mjs youtube  # visible browser
SLOWMO=300 node live.mjs bing    # slow actions for screenshots
```

For every site the harness checks:

- adapter match and mount container/insert rule;
- `data-derecherche-status="rendered"` and the rendered engine count;
- the bar is in the viewport;
- a 3x3 `elementFromPoint` coverage test (`9/9` means nothing covers the bar);
- plain click navigates to another engine with the current query;
- frecency is written to storage.

Screenshots are written to `shots/`, which is ignored by git.

Datacenter IPs are blocked by some sites. Google, Baidu, Brave, and Zhihu can
return captcha/verification pages; the harness reports those as not mounted
instead of treating the bot wall as a search result.

## Offline fixtures

```bash
node fixtures.mjs
```

Every `fixtures/<site>/mount.html` is served at its real adapter URL with route
interception. No network is used, so this covers fixed-header cases such as
Baidu even when the live site is blocked. The same coverage test runs, and the
script fails if any fixture is not mounted, not visible, or covered.

## Layout behavior

The InlineBar stays in normal document flow. It:

- moves out of a flex/grid header row;
- reserves transparent space below a fixed or overflowing header;
- is pushed below docked top overlays;
- receives a left/right inset for fixed side panels;
- re-settles after late header rendering, resize, and SPA updates.

The live harness reports these values as `offset`, `inset`, and `coverage`.
