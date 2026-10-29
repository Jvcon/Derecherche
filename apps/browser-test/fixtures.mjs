// Offline layout test for the InlineBar. Each fixture is served at the real
// adapter URL (no network), the userscript is injected at document-idle, and
// the bar must render, stay in the viewport, and survive an occlusion hit test.
//
// Usage:
//   node fixtures.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const bundlePath =
  process.env.DERECHERCHE_BUNDLE ||
  path.resolve(here, "../userscript/dist/derecherche-test.user.js");
const code = fs.readFileSync(bundlePath, "utf8");
const fixturesDir = path.join(repo, "fixtures");
const shotsDir = path.join(here, "shots");
fs.mkdirSync(shotsDir, { recursive: true });

const names = fs
  .readdirSync(fixturesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter(
    (name) =>
      fs.existsSync(path.join(fixturesDir, name, "mount.json")) &&
      fs.existsSync(path.join(fixturesDir, name, "mount.html"))
  )
  .sort();

const browser = await chromium.launch({ headless: !process.env.HEADFUL });
const rows = [];

for (const name of names) {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, name, "mount.json"), "utf8")
  );
  const html = fs.readFileSync(
    path.join(fixturesDir, name, "mount.html"),
    "utf8"
  );

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  await context.route("**/*", async (route) => {
    if (route.request().url() === fixture.url) {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: html,
      });
      return;
    }
    await route.abort();
  });
  await context.addInitScript({ content: code });

  const page = await context.newPage();
  const result = { site: name, url: fixture.url };
  try {
    await page.goto(fixture.url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(3000);

    Object.assign(
      result,
      await page.evaluate(() => {
        const host = document.querySelector("#derecherche-inline-bar");
        if (!host) return { mounted: false };
        const bar = host.shadowRoot?.querySelector(".bar");
        const rect = (bar ?? host).getBoundingClientRect();
        const points = [];
        for (const fy of [0.15, 0.5, 0.85]) {
          for (const fx of [0.02, 0.5, 0.98]) {
            const x = Math.min(
              Math.max(rect.left + rect.width * fx, 0),
              innerWidth - 1
            );
            const y = Math.min(
              Math.max(rect.top + rect.height * fy, 0),
              innerHeight - 1
            );
            points.push(document.elementFromPoint(x, y) === host);
          }
        }
        const header = document.querySelector("#head, header, [role='banner']");
        const headerRect = header?.getBoundingClientRect();
        return {
          mounted: true,
          site: host.dataset.derechercheSite,
          mount: host.dataset.derechercheMount,
          insert: host.dataset.derechercheInsert,
          status: host.dataset.derechercheStatus,
          engines: Number(host.dataset.derechercheEngines || 0),
          offset: host.dataset.derechercheOffset ?? null,
          inset: host.dataset.derechercheInset ?? null,
          relocated: host.dataset.derechercheRelocated ?? null,
          rect: {
            top: Math.round(rect.top),
            height: Math.round(rect.height),
            width: Math.round(rect.width),
          },
          headerBottom: headerRect ? Math.round(headerRect.bottom) : null,
          coveredByHeader:
            headerRect && rect.top < headerRect.bottom
              ? Math.round(headerRect.bottom - rect.top)
              : 0,
          coverage: `${points.filter(Boolean).length}/${points.length}`,
          inViewport: rect.top >= -1 && rect.bottom <= innerHeight + 1,
          trimPadding: document.querySelector("#s_tab")
            ? getComputedStyle(document.querySelector("#s_tab")).paddingTop
            : null,
        };
      })
    );

    result.pass =
      result.mounted &&
      result.status === "rendered" &&
      result.engines > 0 &&
      result.inViewport &&
      result.coverage.split("/")[0] === result.coverage.split("/")[1] &&
      (!result.trimPadding || result.trimPadding === "0px");

    if (name === "baidu") {
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(900);
      const docked = await page.evaluate(() => {
        const host = document.querySelector("#derecherche-inline-bar");
        const bar = host?.shadowRoot?.querySelector(".bar");
        const rect = (bar ?? host)?.getBoundingClientRect();
        const points = [];
        if (rect) {
          for (const fy of [0.15, 0.5, 0.85]) {
            for (const fx of [0.02, 0.5, 0.98]) {
              const x = Math.min(
                Math.max(rect.left + rect.width * fx, 0),
                innerWidth - 1
              );
              const y = Math.min(
                Math.max(rect.top + rect.height * fy, 0),
                innerHeight - 1
              );
              points.push(document.elementFromPoint(x, y) === host);
            }
          }
        }
        return {
          docked: host?.dataset.derechercheDocked === "true",
          position: host ? getComputedStyle(host).position : null,
          top: rect ? Math.round(rect.top) : null,
          coverage: `${points.filter(Boolean).length}/${points.length}`,
        };
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(900);
      const restored = await page.evaluate(() => {
        const host = document.querySelector("#derecherche-inline-bar");
        const bar = host?.shadowRoot?.querySelector(".bar");
        const rect = (bar ?? host)?.getBoundingClientRect();
        return {
          docked: host?.dataset.derechercheDocked === "true",
          position: host ? getComputedStyle(host).position : null,
          top: rect ? Math.round(rect.top) : null,
        };
      });
      result.scrolled = docked;
      result.restored = restored;
      result.pass =
        result.pass &&
        docked.docked &&
        docked.coverage === "9/9" &&
        restored.docked === false;
    }

    await page.screenshot({
      path: path.join(shotsDir, `fixture-${name}.png`),
    });
  } catch (error) {
    result.error = String(error).split("\n")[0];
    result.pass = false;
  }

  await context.close();
  rows.push(result);
  console.log(
    `${result.pass ? "PASS" : "FAIL"} ${name.padEnd(15)} ` +
      (result.mounted
        ? `mount=${result.mount}/${result.insert} coverage=${result.coverage} ` +
          `top=${result.rect.top} headerBottom=${result.headerBottom} covered=${result.coveredByHeader} ` +
          `offset=${result.offset ?? "-"} inset=${result.inset ?? "-"} trim=${result.trimPadding ?? "-"}` +
          (result.scrolled
            ? ` dock=${result.scrolled.docked ? `fixed@${result.scrolled.top}` : "no"} dockCoverage=${result.scrolled.coverage} restored=${result.restored?.docked ? "fixed" : "flow"}`
            : "")
        : `error=${result.error || "not mounted"}`)
  );
}

await browser.close();
const ok = rows.filter((row) => row.pass).length;
console.log(`\n${ok}/${rows.length} fixtures mounted, visible, and uncovered.`);
process.exit(ok === rows.length ? 0 : 1);
