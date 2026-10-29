import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";
import catalog from "@derecherche/data";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const bundleName = process.env.DERECHERCHE_BUNDLE ?? "derecherche.user.js";
const bundlePath = path.isAbsolute(bundleName)
  ? bundleName
  : path.join(root, "dist", bundleName);
const code = fs.readFileSync(bundlePath, "utf8");

function tick(window) {
  return new Promise((resolve) => window.setTimeout(resolve, 30));
}

function googleWindow() {
  const window = new Window({
    url: "https://www.google.com/search?q=rust+async",
  });
  window.document.body.innerHTML = `
    <header id="gb"><form id="tsf"><input name="q" value="rust async"></form></header>
    <div id="main"><div id="search">results</div></div>
  `;
  return window;
}

test("userscript bundle has metadata and every adapter match host", () => {
  assert.ok(code.startsWith("// ==UserScript==\n"));
  assert.ok(code.includes("// @grant        GM_getValue"));
  assert.ok(code.includes("// @grant        GM_setValue"));
  assert.ok(code.includes("// @noframes"));

  for (const host of new Set(catalog.sites.flatMap((site) => site.hosts))) {
    assert.ok(
      code.includes(`// @match        *://${host}/*`),
      `missing @match for ${host}`
    );
  }

  assert.ok(fs.statSync(bundlePath).size < 250_000);
});

test("userscript mounts the InlineBar on a Google result page", async () => {
  const window = googleWindow();
  window.eval(code);
  await tick(window);

  const host = window.document.querySelector("#derecherche-inline-bar");
  assert.ok(host);
  assert.equal(host.nextElementSibling?.id, "main");
  assert.equal(host.shadowRoot.querySelectorAll("button.engine").length, 6);
  assert.ok(host.shadowRoot.querySelector("button.more"));
  window.close();
});

test("userscript reuses one InlineBar across SPA query changes", async () => {
  const window = googleWindow();
  window.eval(code);
  await tick(window);

  const first = window.document.querySelector("#derecherche-inline-bar");
  window.history.pushState(
    {},
    "",
    "https://www.google.com/search?q=typescript"
  );
  await tick(window);

  const hosts = window.document.querySelectorAll("#derecherche-inline-bar");
  assert.equal(hosts.length, 1);
  assert.equal(hosts[0], first);
  assert.equal(hosts[0].nextElementSibling?.id, "main");
  window.close();
});

test("userscript mounts on Baidu and stays out of unmatched pages", async () => {
  const baidu = new Window({ url: "https://www.baidu.com/s?wd=rust" });
  baidu.document.body.innerHTML = `
    <div id="head"><form><input id="kw" name="wd" value="rust"></form></div>
    <div id="content_left">results</div>
  `;
  baidu.eval(code);
  await tick(baidu);
  const host = baidu.document.querySelector("#derecherche-inline-bar");
  assert.ok(host);
  assert.equal(host.previousElementSibling?.id, "head");
  baidu.close();

  const other = new Window({ url: "https://example.org/search?q=rust" });
  other.document.body.innerHTML = `<header><form><input name="q" value="rust"></form></header>`;
  other.eval(code);
  await tick(other);
  assert.equal(other.document.querySelector("#derecherche-inline-bar"), null);
  other.close();
});

test("userscript persists frecency through GM storage", async () => {
  const store = new Map();
  let reads = 0;

  function installGm(window) {
    window.GM_getValue = (key, fallback) => {
      reads += 1;
      return store.has(key) ? store.get(key) : fallback;
    };
    window.GM_setValue = (key, value) => {
      store.set(key, value);
    };
    window.open = () => null;
  }

  const first = googleWindow();
  installGm(first);
  first.eval(code);
  await tick(first);

  const host = first.document.querySelector("#derecherche-inline-bar");
  const button = host.shadowRoot.querySelector("button.engine");
  const engineId = button.dataset.engineId;
  button.dispatchEvent(
    new first.MouseEvent("click", {
      bubbles: true,
      composed: true,
      ctrlKey: true,
    })
  );
  await tick(first);

  const raw = store.get("derecherche:frecency");
  assert.ok(raw);
  const entries = JSON.parse(raw);
  assert.equal(entries[0].engineId, engineId);
  assert.equal(entries[0].count, 1);
  first.close();

  const readsBefore = reads;
  const second = googleWindow();
  installGm(second);
  second.eval(code);
  await tick(second);
  assert.ok(reads > readsBefore);
  second.close();
});
