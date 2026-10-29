import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(
  process.env.DERECHERCHE_BUNDLE || path.resolve(here, "../userscript/dist/derecherche-test.user.js"),
  "utf8"
);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(
  `(() => {
    const run = () => {
      try { (0, eval)(\${JSON.stringify(code)}); console.log('[debug] eval done'); }
      catch (e) { console.error('[debug] eval failed:', e && e.stack); }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(run, 0));
    } else { setTimeout(run, 0); }
  })()`
);
const page = await context.newPage();
page.on("console", (m) => console.log(`[console:${m.type()}]`, m.text().slice(0, 300)));
page.on("pageerror", (e) => console.log("[pageerror]", String(e).split("\n").slice(0, 4).join("\n")));

const url = process.argv[2] || "https://github.com/search?q=playwright&type=repositories";
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(5000);

console.log("final:", page.url());
console.log("bar:", await page.evaluate(() => {
  const bar = document.getElementById("derecherche-inline-bar");
  return bar ? { html: bar.outerHTML.slice(0, 200), ds: { ...bar.dataset } } : null;
}));
// Did the script's top-level even run? Probe what it declares.
console.log("probe:", await page.evaluate(() => ({
  hasMarker: /derecherche/i.test(document.documentElement.outerHTML.slice(0, 200000)) ,
})));
await browser.close();
