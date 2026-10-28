import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";
import catalog from "@derecherche/data";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const bundlePath = path.join(root, "dist", "derecherche.user.js");
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
  assert.ok(code.includes("// @grant        none"));
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
  assert.equal(host.nextElementSibling?.id, "search");
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
  assert.equal(hosts[0].nextElementSibling?.id, "search");
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
