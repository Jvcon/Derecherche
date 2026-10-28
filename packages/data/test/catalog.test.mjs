import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "generated", "catalog.json"), "utf8")
);
const icons = JSON.parse(
  fs.readFileSync(path.join(root, "generated", "icons.json"), "utf8")
);
const sprite = fs.readFileSync(
  path.join(root, "generated", "icons.svg"),
  "utf8"
);

const categoryIds = new Set();
for (const category of catalog.categories) {
  categoryIds.add(category.id);
  for (const child of category.children ?? []) {
    categoryIds.add(child.id);
  }
}

const providerIds = new Set(catalog.providers.map((provider) => provider.id));
const engineIds = new Set(catalog.engines.map((engine) => engine.id));

test("catalog and schema versions are present", () => {
  assert.equal(catalog.schemaVersion, 1);
  assert.match(catalog.catalogVersion, /^\d{4}\.\d{2}\.\d+$/);
});

test("category ids are unique and well formed", () => {
  assert.ok(categoryIds.size > 0);
  for (const id of categoryIds) {
    assert.match(id, /^[a-z0-9][a-z0-9-]*$/);
  }
});

test("provider ids are unique", () => {
  assert.equal(providerIds.size, catalog.providers.length);
});

test("engine ids and references are valid", () => {
  assert.equal(engineIds.size, catalog.engines.length);
  for (const engine of catalog.engines) {
    assert.match(engine.id, /^[a-z0-9][a-z0-9-]*$/);
    assert.ok(providerIds.has(engine.providerId), `missing provider for ${engine.id}`);
    assert.ok(categoryIds.has(engine.category), `missing category for ${engine.id}`);
    assert.ok([undefined, "active", "deprecated", "broken"].includes(engine.status));
  }
});

test("engine URLs are http(s) templates with {q}", () => {
  for (const engine of catalog.engines) {
    assert.ok(engine.url.includes("{q}"), `missing {q} for ${engine.id}`);
    const url = new URL(engine.url.replaceAll("{q}", "test"));
    assert.ok(["http:", "https:"].includes(url.protocol), `invalid protocol for ${engine.id}`);
  }
});

test("site ids, categories, and path patterns are valid", () => {
  const siteIds = new Set();
  for (const site of catalog.sites) {
    assert.match(site.id, /^[a-z0-9][a-z0-9-]*$/);
    assert.equal(siteIds.has(site.id), false);
    siteIds.add(site.id);
    assert.ok(categoryIds.has(site.defaultCategory), `missing default category for ${site.id}`);
    if (site.pathPattern) {
      assert.doesNotThrow(() => new RegExp(site.pathPattern));
    }
  }
});

test("icon manifest covers every provider exactly once", () => {
  assert.equal(icons.license, "CC0-1.0");
  assert.equal(icons.source, "Simple Icons");
  assert.equal(icons.sprite, "icons.svg");
  assert.ok(sprite.includes("<symbol"));

  const mapped = new Set(Object.keys(icons.icons));
  const missing = new Set(icons.missing);
  for (const id of mapped) {
    assert.ok(providerIds.has(id), `icon maps unknown provider ${id}`);
    assert.ok(icons.icons[id].symbol.startsWith("si-"));
    assert.ok(icons.icons[id].title.length > 0);
    assert.equal(missing.has(id), false);
  }
  for (const id of missing) {
    assert.ok(providerIds.has(id), `missing icon lists unknown provider ${id}`);
  }
  assert.equal(mapped.size + missing.size, providerIds.size);
});
