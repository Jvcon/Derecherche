import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { resolveMount } from "../dist/index.js";

function page(html) {
  const window = new Window();
  window.document.body.innerHTML = html;
  return window.document;
}

function site(mount) {
  return {
    id: "test",
    name: "Test Search",
    hosts: ["example.com"],
    defaultCategory: "web-general",
    mount,
  };
}

test("resolveMount prefers the first matching container rule", () => {
  const document = page(`
    <header id="page-header"><form><input name="q"></form></header>
    <div id="search"><div id="results"></div></div>
  `);
  const result = resolveMount(
    document,
    site({
      rules: [
        { container: ["#missing", "#search"], insert: "before" },
        { container: "#page-header", insert: "after" },
      ],
    })
  );

  assert.equal(result.target?.selector, "#search");
  assert.equal(result.target?.kind, "container");
  assert.equal(result.target?.insert, "before");
  assert.equal(result.attempts[0].selector, "#missing");
  assert.equal(result.attempts[0].found, false);
});

test("resolveMount falls back through anchor selectors", () => {
  const document = page(`
    <header><form id="searchform"><input name="q"></form></header>
  `);
  const result = resolveMount(
    document,
    site({
      rules: [
        { container: "#missing" },
        { anchor: ["#also-missing", "#searchform"], insert: "after" },
      ],
    })
  );

  assert.equal(result.target?.selector, "#searchform");
  assert.equal(result.target?.kind, "anchor");
});

test("resolveMount skips invalid selectors and records the error", () => {
  const document = page(`<header><input name="q"></header>`);
  const result = resolveMount(
    document,
    site({ rules: [{ container: ["[", "header"], insert: "after" }] })
  );

  assert.equal(result.target?.selector, "header");
  assert.equal(result.attempts[0].selector, "[");
  assert.equal(result.attempts[0].found, false);
  assert.ok(result.attempts[0].error);
});

test("resolveMount uses generic fallbacks only when allowed", () => {
  const document = page(`<header id="generic"><input name="q"></header>`);

  const fallback = resolveMount(document, site({ rules: [{ container: "#missing" }] }));
  assert.equal(fallback.target?.selector, "header");
  assert.equal(fallback.target?.source, "generic");

  const required = resolveMount(
    document,
    site({ required: true, rules: [{ container: "#missing" }] })
  );
  assert.equal(required.target, null);

  const disabled = resolveMount(
    document,
    site({ rules: [{ container: "#missing" }] }),
    { genericFallback: false }
  );
  assert.equal(disabled.target, null);
});

test("resolveMount returns null when nothing can be resolved", () => {
  const document = page(`<main>no search UI</main>`);
  const result = resolveMount(document, site({ rules: [{ container: "#missing" }] }));

  assert.equal(result.target, null);
  assert.ok(result.attempts.length > 0);
});
