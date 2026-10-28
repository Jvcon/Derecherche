import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";
import catalog from "@derecherche/data";
import { extractQuery } from "../dist/index.js";

const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const fixturesRoot = path.join(root, "fixtures");
const fixtureNames = fs
  .readdirSync(fixturesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function readFixture(name) {
  const dir = path.join(fixturesRoot, name);
  return {
    name,
    url: fs.readFileSync(path.join(dir, "url.txt"), "utf8").trim(),
    html: fs.readFileSync(path.join(dir, "page.html"), "utf8"),
    expected: JSON.parse(
      fs.readFileSync(path.join(dir, "expected.json"), "utf8")
    ),
  };
}

function parseDocument(html, url) {
  const window = new Window({ url });
  window.document.body.innerHTML = html;
  return window.document;
}

function snapshotDocument(document) {
  return {
    querySelector(selector) {
      const element = document.querySelector(selector);
      if (!element) return null;
      return {
        getAttribute(name) {
          return element.getAttribute(name);
        },
        textContent: element.textContent,
      };
    },
  };
}

test("every site adapter has a fixture and every fixture has an adapter", () => {
  const siteIds = new Set(catalog.sites.map((site) => site.id));
  const fixtureSiteIds = new Set(
    fixtureNames.map((name) => readFixture(name).expected.siteId)
  );

  assert.deepEqual([...fixtureSiteIds].sort(), [...siteIds].sort());
});

for (const name of fixtureNames) {
  const fixture = readFixture(name);

  test(`${name}: URL-only extraction`, () => {
    const result = extractQuery({ url: fixture.url }, catalog.sites);
    assert.equal(result?.adapterId, fixture.expected.siteId);
    assert.equal(result?.query, fixture.expected.query);
    assert.equal(result?.source, "url");
  });

  test(`${name}: HTML snapshot extraction`, () => {
    const site = catalog.sites.find(
      (candidate) => candidate.id === fixture.expected.siteId
    );
    assert.ok(site);

    const document = snapshotDocument(
      parseDocument(fixture.html, fixture.expected.htmlUrl)
    );
    const result = extractQuery(
      {
        url: fixture.expected.htmlUrl,
        document,
        documentKind: "html",
      },
      [site]
    );

    assert.equal(result?.query, fixture.expected.query);
    assert.equal(result?.source, "searchbox");
    assert.equal(result?.adapterId, site.id);
  });

  test(`${name}: live DOM extraction`, () => {
    const site = catalog.sites.find(
      (candidate) => candidate.id === fixture.expected.siteId
    );
    assert.ok(site);

    const document = parseDocument(fixture.html, fixture.expected.htmlUrl);
    const result = extractQuery(
      {
        url: fixture.expected.htmlUrl,
        document,
        documentKind: "dom",
      },
      [site]
    );

    assert.equal(result?.query, fixture.expected.query);
    assert.equal(result?.source, "searchbox");
    assert.equal(result?.adapterId, site.id);
  });
}
