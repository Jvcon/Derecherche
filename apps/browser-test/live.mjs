// Live-browser test for the Derecherche userscript via Playwright.
// Injects dist/derecherche-test.user.js at document-idle (like a real
// userscript manager with @grant none semantics: GM_* absent, localStorage
// fallback is used) and verifies InlineBar mounting on real search pages.
//
// Usage:
//   node live.mjs [site ...]        e.g. `node live.mjs google bing`
//   HEADFUL=1 node live.mjs         watch in a visible browser
//   SLOWMO=300 node live.mjs        delay actions for visual inspection
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const bundlePath =
  process.env.DERECHERCHE_BUNDLE ||
  path.resolve(here, "../userscript/dist/derecherche-test.user.js");
const code = fs.readFileSync(bundlePath, "utf8");
const shotsDir = path.join(here, "shots");
fs.mkdirSync(shotsDir, { recursive: true });

const SITES = {
  google: ["https://www.google.com/search?q=typescript+rust+comparison&hl=en&num=10&gbv=1", "typescript rust comparison"],
  "google-scholar": ["https://scholar.google.com/scholar?q=transformer+attention", "transformer attention"],
  bing: ["https://www.bing.com/search?q=typescript+rust+comparison", "typescript rust comparison"],
  "cn-bing": ["https://cn.bing.com/search?q=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD", "人工智能"],
  duckduckgo: ["https://duckduckgo.com/?q=typescript+rust+comparison", "typescript rust comparison"],
  brave: ["https://search.brave.com/search?q=typescript+rust+comparison", "typescript rust comparison"],
  baidu: ["https://www.baidu.com/s?wd=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD", "人工智能"],
  wikipedia: ["https://en.wikipedia.org/w/index.php?search=typescript+compiler+design&title=Special:Search&fulltext=1", "typescript compiler design"],
  github: ["https://github.com/search?q=playwright&type=repositories", "playwright"],
  youtube: ["https://www.youtube.com/results?search_query=rust+programming", "rust programming"],
  bilibili: ["https://search.bilibili.com/all?keyword=Rust%E8%AF%AD%E8%A8%80", "Rust语言"],
  zhihu: ["https://www.zhihu.com/search?type=content&q=Rust%E8%AF%AD%E8%A8%80", "Rust语言"],
};

const argv = process.argv.slice(2).filter((a) => SITES[a]);
const targets = argv.length ? argv : Object.keys(SITES);

function stripCsp(context) {
  // Page CSP blocks our eval-injection (real userscript managers are exempt).
  return context.route("**/*", async (route) => {
    try {
      const resp = await route.fetch({ maxRedirects: 10 });
      const headers = {};
      for (const [k, v] of Object.entries(resp.headers())) {
        if (/^content-security-policy(-report-only)?$/i.test(k)) continue;
        if (/^(content-length|transfer-encoding)$/i.test(k)) continue;
        headers[k] = v;
      }
      await route.fulfill({ response: resp, headers });
    } catch {
      await route.continue().catch(() => {});
    }
  });
}

function injectScript(context) {
  // Simulate @run-at document-idle: wait for DOMContentLoaded, then eval.
  // Pass the bundle as a structured arg (no string embedding -> no escaping bugs).
  return context.addInitScript(
    (code) => {
      const run = () => {
        try { (0, eval)(code); }
        catch (e) { console.error('[Derecherche inject]', e && e.message); }
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(run, 0));
      } else {
        setTimeout(run, 0);
      }
    },
    code
  );
}

async function inspect(page) {
  const probe = () => page.evaluate(() => {
    const host = document.getElementById("derecherche-inline-bar");
    if (!host) {
      return { mounted: false, console: window.__drErrors || [] };
    }
    const cs = getComputedStyle(host);
    const root = host.shadowRoot;
    const bar = root ? root.querySelector(".bar") : null;
    const rect = (bar || host).getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const buttons = root ? [...root.querySelectorAll("button[data-engine-id]")] : [];

    // A point belongs to the InlineBar when elementFromPoint retargets to the
    // shadow host. Fixed headers and sidebars do not retarget, so they show up
    // as misses even though the host rect itself has a positive size.
    const points = [];
    for (const fy of [0.15, 0.5, 0.85]) {
      for (const fx of [0.02, 0.5, 0.98]) {
        const x = Math.min(Math.max(rect.left + rect.width * fx, 0), innerWidth - 1);
        const y = Math.min(Math.max(rect.top + rect.height * fy, 0), innerHeight - 1);
        const hit = document.elementFromPoint(x, y);
        points.push({ x: Math.round(x), y: Math.round(y), hit: hit === host });
      }
    }
    const hits = points.filter((point) => point.hit).length;
    const fullyCovered = hits === 0;
    const inViewport = rect.top >= -1 && rect.bottom <= innerHeight + 1;
    return {
      mounted: true,
      shadow: !!root,
      site: host.dataset.derechercheSite || null,
      mount: host.dataset.derechercheMount || null,
      insert: host.dataset.derechercheInsert || null,
      status: host.dataset.derechercheStatus || null,
      engines: Number(host.dataset.derechercheEngines || buttons.length) || buttons.length,
      hasMore: !!(root && root.querySelector("button[data-action=more], .more")),
      visible:
        rect.width > 0 &&
        rect.height > 0 &&
        cs.display !== "none" &&
        inViewport &&
        !fullyCovered,
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
      hostRect: { x: Math.round(hostRect.x), y: Math.round(hostRect.y), w: Math.round(hostRect.width), h: Math.round(hostRect.height) },
      paddingTop: cs.paddingTop,
      offset: host.dataset.derechercheOffset || null,
      inset: host.dataset.derechercheInset || null,
      relocated: host.dataset.derechercheRelocated || null,
      coverage: {
        hits,
        total: points.length,
        fullyCovered,
        misses: points.filter((point) => !point.hit).slice(0, 4),
      },
      parentTag: host.parentElement ? host.parentElement.id || host.parentElement.className || host.parentElement.tagName : null,
      engineIds: buttons.slice(0, 8).map((b) => b.dataset.engineId),
      buttonLabels: buttons.slice(0, 8).map((b) => (b.textContent || "").trim()).filter(Boolean),
      console: window.__drErrors || [],
    };
  });
  // Pages like Bing re-navigate client-side; retry when the context dies.
  for (let i = 0; i < 4; i++) {
    try { return await probe(); }
    catch (e) {
      if (!/Execution context was destroyed|navigation/i.test(String(e))) throw e;
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(1500);
    }
  }
  return probe();
}

async function testSite(name, url, expectedQuery, browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: name.startsWith("cn") || ["baidu", "bilibili", "zhihu"].includes(name) ? "zh-CN" : "en-US",
  });
  await stripCsp(context);
  await injectScript(context);
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /\[Derecherche|derecherche/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => {
    if (/derecherche/i.test(String(e))) errors.push(String(e).split("\n")[0]);
  });

  const result = { site: name, url };
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    result.http = resp ? resp.status() : null;
    result.finalUrl = page.url();
    // Real pages need a moment to render results / headers.
    await page.waitForTimeout(3500);

    let info = await inspect(page);
    if (!info.mounted) {
      // Retry once after a soft re-trigger (SPA renders late).
      await page.waitForTimeout(3000);
      info = await inspect(page);
    }
    Object.assign(result, info);
    result.console = [...result.console, ...errors];

    if (result.mounted) {
      await page.screenshot({ path: path.join(shotsDir, `${name}.png`) });
      // Interaction: click first engine button, expect navigation to that
      // engine's results URL carrying the page's query.
      const before = page.url();
      const siteId = result.site;
      try {
        const nav = page.waitForURL((u) => u.toString() !== before, { timeout: 20000, waitUntil: "commit" });
        nav.catch(() => {}); // host pages sometimes re-navigate and reject this
        const clicked = await page.evaluate((sid) => {
          const bar = document.getElementById("derecherche-inline-bar");
          const btns = [...(bar?.shadowRoot?.querySelectorAll("button[data-engine-id]") || [])];
          // Prefer a non-self engine: clicking the same engine as the current
          // host may be a same-URL assign with no visible navigation.
          const btn = btns.find((b) => b.dataset.engineId !== sid) || btns[0];
          if (!btn) return null;
          const label = (btn.textContent || "").trim();
          const engineId = btn.dataset.engineId;
          btn.click();
          return `${engineId} (${label})`;
        }, siteId);
        result.clickedLabel = clicked;
        await nav;
        result.clickedUrl = page.url();
        result.clickNavigated = true;
        const norm = (s) => decodeURIComponent(s).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
        result.queryInUrl = !!expectedQuery && norm(page.url()).includes(norm(expectedQuery));
      } catch (e) {
        result.clickNavigated = false;
        result.clickError = String(e).split("\n")[0].slice(0, 120);
      }
      result.console = [...(result.console || []), ...errors];
      // Frecency persistence: return to the original origin, then read storage.
      try {
        if (result.clickNavigated) await page.goBack({ waitUntil: "domcontentloaded", timeout: 15000 });
        result.frecency = await page.evaluate(() => {
          const keys = Object.keys(localStorage).filter((k) => /derecherche/i.test(k));
          return keys.map((k) => k + "=" + String(localStorage.getItem(k)).slice(0, 80));
        }).catch(() => []);
      } catch {
        result.frecency = ["(could not return to origin)"];
      }
    } else {
      // Capture why: page title + whether the expected mount anchor exists.
      result.title = await page.title().catch(() => null);
      await page.screenshot({ path: path.join(shotsDir, `${name}.png`) });
    }
  } catch (e) {
    result.error = String(e).split("\n")[0];
    try { await page.screenshot({ path: path.join(shotsDir, `${name}.png`) }); } catch {}
  }
  await context.close();
  return result;
}

const browser = await chromium.launch({
  headless: !process.env.HEADFUL,
  slowMo: Number(process.env.SLOWMO || 0),
});
const rows = [];
for (const name of targets) {
  const [url, expectedQuery] = SITES[name];
  process.stdout.write(`# ${name} ... `);
  const r = await testSite(name, url, expectedQuery, browser);
  console.log(
    r.mounted
      ? `MOUNTED site=${r.site} engines=${r.engines} visible=${r.visible} coverage=${r.coverage?.hits}/${r.coverage?.total} inset=${r.inset || "-"} offset=${r.offset || r.paddingTop} relocated=${r.relocated || "-"} click=${r.clickNavigated ? "navigated" : "FAILED"} queryInUrl=${r.queryInUrl}`
      : `NOT MOUNTED (http=${r.http} title=${JSON.stringify(r.title)} error=${r.error || "none"})`
  );
  rows.push(r);
}
await browser.close();

console.log("\n=== SUMMARY ===");
for (const r of rows) {
  console.log(
    `${r.mounted && r.visible && r.coverage && r.coverage.hits === r.coverage.total ? "PASS" : "FAIL"} ${r.site.padEnd(15)} http=${r.http ?? "-"} ` +
      (r.mounted
        ? `mount=${r.mount}/${r.insert} engines=${r.engines} visible=${r.visible} coverage=${r.coverage?.hits}/${r.coverage?.total} inset=${r.inset || "-"} offset=${r.offset || r.paddingTop} relocated=${r.relocated || "-"} click=${r.clickNavigated ? "OK " + (r.clickedUrl || "").slice(0, 60) : "FAIL " + r.clickError} queryInUrl=${r.queryInUrl} frecency=${(r.frecency || []).length ? "stored" : "none"} parent=${r.parentTag}`
        : `error=${r.error || (r.console.length ? "console errors" : "adapter did not mount")}`)
  );
  if (r.console && r.console.length) console.log(`   console: ${r.console.slice(0, 3).join(" | ")}`);
}
const ok = rows.filter(
  (r) => r.mounted && r.visible && r.coverage && r.coverage.hits === r.coverage.total
).length;
console.log(`\n${ok}/${rows.length} mounted, visible, and uncovered. Screenshots: ${shotsDir}`);
