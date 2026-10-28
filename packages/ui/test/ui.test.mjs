import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";
import catalog from "@derecherche/data";
import {
  createShadowHost,
  mountInlineBar,
  observeAnchor,
  positionAroundRect,
  positionAtAnchor,
  positionFloating,
} from "../dist/index.js";

function rect(top, left, width, height) {
  return {
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

test("shadow host mounts isolated content and unmounts cleanly", () => {
  const window = new Window();
  const shadow = createShadowHost({
    id: "derecherche-test",
    document: window.document,
    css: ".surface { color: red; }",
  });

  assert.equal(shadow.isMounted(), false);
  shadow.mount(window.document.body);
  assert.equal(shadow.isMounted(), true);
  assert.equal(shadow.host.id, "derecherche-test");
  assert.ok(shadow.host.shadowRoot);
  assert.equal(shadow.shadowRoot?.querySelector("style")?.textContent.includes("all: initial"), true);
  assert.ok(shadow.shadowRoot?.querySelector("style")?.textContent.includes(".surface"));
  assert.equal(shadow.content.dataset.derechercheContent, "");

  shadow.mount(window.document.body);
  assert.equal(window.document.querySelectorAll("#derecherche-test").length, 1);

  shadow.unmount();
  assert.equal(shadow.isMounted(), false);
  assert.equal(window.document.querySelector("#derecherche-test"), null);
});

test("positionAroundRect places below and clamps to the viewport", () => {
  const position = positionAroundRect(rect(100, 100, 200, 20), {
    width: 300,
    height: 100,
  }, {
    viewport: { width: 1000, height: 800 },
    placement: "below",
    offset: 8,
    padding: 8,
  });

  assert.equal(position.placement, "below");
  assert.equal(position.top, 128);
  assert.equal(position.left, 100);
  assert.equal(position.maxWidth, 984);
});

test("positionAroundRect flips above near the bottom", () => {
  const position = positionAroundRect(rect(750, 900, 100, 20), {
    width: 300,
    height: 100,
  }, {
    viewport: { width: 1000, height: 800 },
    placement: "below",
    offset: 8,
    padding: 8,
  });

  assert.equal(position.placement, "above");
  assert.equal(position.top, 642);
  assert.equal(position.left, 692);
});

test("positionAtAnchor writes element styles", () => {
  const window = new Window();
  const element = window.document.createElement("div");
  const anchor = {
    getBoundingClientRect: () => rect(100, 100, 200, 20),
  };

  const position = positionAtAnchor(element, anchor, {
    viewport: { width: 1000, height: 800 },
    size: { width: 300, height: 100 },
    placement: "below",
  });

  assert.equal(position.top, 128);
  assert.equal(element.style.top, "128px");
  assert.equal(element.style.left, "100px");
  assert.equal(element.style.maxWidth, "984px");
});

test("positionFloating anchors to the bottom right", () => {
  const window = new Window();
  const element = window.document.createElement("div");
  const position = positionFloating(element, {
    viewport: { width: 1000, height: 800 },
    size: { width: 300, height: 100 },
    padding: 8,
  });

  assert.equal(position.left, 692);
  assert.equal(position.top, 692);
  assert.equal(element.style.left, "692px");
  assert.equal(element.style.top, "692px");
});

test("observeAnchor updates on scroll/resize and cleans up", () => {
  const window = new Window();
  const element = window.document.createElement("div");
  const anchor = {
    getBoundingClientRect: () => rect(100, 100, 200, 20),
  };

  let updates = 0;
  const cleanup = observeAnchor(anchor, () => {
    updates += 1;
  }, { window, resizeObserver: false });

  window.dispatchEvent(new window.Event("scroll"));
  window.dispatchEvent(new window.Event("resize"));
  assert.equal(updates, 2);

  cleanup();
  window.dispatchEvent(new window.Event("scroll"));
  assert.equal(updates, 2);
  void element;
});


function inlineCatalog() {
  return {
    schemaVersion: 1,
    catalogVersion: "test",
    categories: [
      {
        id: "web-general",
        name: "Web",
        order: 1,
        children: [{ id: "web-code", name: "Code", order: 1 }],
      },
    ],
    providers: [
      { id: "google", name: "Google" },
      { id: "github", name: "GitHub" },
      { id: "microsoft", name: "Microsoft" },
    ],
    engines: [
      {
        id: "google-web",
        providerId: "google",
        name: "Google",
        category: "web-general",
        url: "https://www.google.com/search?q={q}",
        status: "active",
      },
      {
        id: "github",
        providerId: "github",
        name: "GitHub",
        category: "web-code",
        url: "https://github.com/search?q={q}",
        tags: ["code"],
        triggers: ["github"],
        status: "active",
      },
      {
        id: "bing",
        providerId: "microsoft",
        name: "Bing",
        category: "web-general",
        url: "https://www.bing.com/search?q={q}",
        status: "active",
      },
    ],
    sites: [
      {
        id: "google",
        name: "Google Search",
        hosts: ["www.google.com"],
        urlParams: ["q"],
        defaultCategory: "web-general",
        mount: { anchor: 'input[name="q"]' },
      },
    ],
  };
}

function inlinePage() {
  const window = new Window();
  window.document.body.innerHTML = `
    <header><form id="searchform"><input name="q" value="rust"></form></header>
    <main id="results"></main>
  `;
  return window;
}

test("InlineBar mounts after the adapter header and renders engines", () => {
  const window = inlinePage();
  const handle = mountInlineBar({
    catalog: inlineCatalog(),
    sites: inlineCatalog().sites,
    query: "github",
    url: "https://www.google.com/search?q=github",
    document: window.document,
  });

  assert.ok(handle);
  const host = window.document.querySelector("#derecherche-inline-bar");
  assert.ok(host);
  assert.equal(host.previousElementSibling?.tagName, "HEADER");
  const buttons = [...host.shadowRoot.querySelectorAll("button.engine")];
  assert.ok(buttons.length >= 2);
  assert.ok(host.shadowRoot.querySelector("button.more"));

  const second = mountInlineBar({
    catalog: inlineCatalog(),
    sites: inlineCatalog().sites,
    query: "github",
    url: "https://www.google.com/search?q=github",
    document: window.document,
  });
  assert.equal(window.document.querySelectorAll("#derecherche-inline-bar").length, 1);

  handle.destroy();
  second.destroy();
  assert.equal(window.document.querySelector("#derecherche-inline-bar"), null);
  window.close();
});

test("InlineBar opens in the current tab and Ctrl-click opens a new tab", () => {
  const window = inlinePage();
  const opened = [];
  const recorded = [];
  const more = [];
  const handle = mountInlineBar({
    catalog: inlineCatalog(),
    sites: inlineCatalog().sites,
    query: "github",
    url: "https://www.google.com/search?q=github",
    document: window.document,
    onOpen: (engine, url, mode) => opened.push([engine.id, url, mode]),
    onEngineOpened: (id) => recorded.push(id),
    onMore: (context) => more.push(context),
  });

  const buttons = [...handle.host.shadowRoot.querySelectorAll("button.engine")];
  const github = buttons.find((button) => button.dataset.engineId === "github");
  github.dispatchEvent(new window.MouseEvent("click", { bubbles: true, composed: true }));
  assert.deepEqual(opened[0], [
    "github",
    "https://github.com/search?q=github",
    "current-tab",
  ]);
  assert.deepEqual(recorded, ["github"]);

  github.dispatchEvent(
    new window.MouseEvent("click", { bubbles: true, composed: true, ctrlKey: true })
  );
  assert.equal(opened[1][2], "new-tab");

  handle.host.shadowRoot
    .querySelector("button.more")
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true, composed: true }));
  assert.equal(more.length, 1);
  assert.equal(more[0].query, "github");
  assert.equal(more[0].categoryId, "web-general");

  handle.update({ query: "bing" });
  assert.equal(handle.host.shadowRoot.querySelectorAll("button.engine").length > 0, true);
  handle.destroy();
  window.close();
});

test("InlineBar returns null when the query is empty", () => {
  const window = inlinePage();
  const handle = mountInlineBar({
    catalog: inlineCatalog(),
    sites: inlineCatalog().sites,
    query: "   ",
    url: "https://www.google.com/search",
    document: window.document,
  });

  assert.equal(handle, null);
  assert.equal(window.document.querySelector("#derecherche-inline-bar"), null);
  window.close();
});


const repoRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const fixturesRoot = path.join(repoRoot, "fixtures");

function mountFixtures() {
  return fs
    .readdirSync(fixturesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) =>
      fs.existsSync(path.join(fixturesRoot, name, "mount.json"))
    )
    .sort();
}

for (const name of mountFixtures()) {
  test(`mount fixture: ${name}`, () => {
    const dir = path.join(fixturesRoot, name);
    const html = fs.readFileSync(path.join(dir, "mount.html"), "utf8");
    const fixture = JSON.parse(
      fs.readFileSync(path.join(dir, "mount.json"), "utf8")
    );

    for (const testCase of fixture.cases) {
      const window = new Window({ url: fixture.url });
      window.document.body.innerHTML = html;
      for (const selector of testCase.remove ?? []) {
        window.document.querySelector(selector)?.remove();
      }

      let resolution;
      const handle = mountInlineBar({
        catalog,
        sites: catalog.sites,
        query: fixture.query,
        url: fixture.url,
        document: window.document,
        onResolve: (value) => {
          resolution = value;
        },
      });

      assert.ok(handle, `${name}: ${testCase.name} should mount`);
      assert.ok(handle.host.isConnected);
      assert.equal(handle.host.dataset.derechercheSite, name);
      assert.equal(handle.host.dataset.derechercheInsert, testCase.insert);
      assert.equal(resolution.target?.selector, testCase.selector);
      assert.equal(resolution.target?.insert, testCase.insert);
      assert.equal(resolution.target?.kind, testCase.kind);

      const container = window.document.querySelector(testCase.selector);
      assert.ok(container);
      if (testCase.insert === "before") {
        assert.equal(handle.host.nextElementSibling, container);
      } else if (testCase.insert === "after") {
        assert.equal(handle.host.previousElementSibling, container);
      } else if (testCase.insert === "append") {
        assert.equal(handle.host.parentElement, container);
        assert.equal(container.lastElementChild, handle.host);
      } else if (testCase.insert === "prepend") {
        assert.equal(handle.host.parentElement, container);
        assert.equal(container.firstElementChild, handle.host);
      }

      assert.equal(
        window.document.querySelectorAll("#derecherche-inline-bar").length,
        1
      );
      handle.destroy();
      window.close();
    }
  });
}

test("InlineBar supports prepend and append insertion", () => {
  for (const insert of ["append", "prepend"]) {
    const window = inlinePage();
    window.document.body.innerHTML = `
      <header><form><input name="q" value="github"></form></header>
      <div id="results"><span>existing</span></div>
    `;
    const catalog = inlineCatalog();
    catalog.sites[0].mount = {
      rules: [{ container: "#results", insert }],
    };

    const handle = mountInlineBar({
      catalog,
      sites: catalog.sites,
      query: "github",
      url: "https://www.google.com/search?q=github",
      document: window.document,
    });

    const results = window.document.querySelector("#results");
    assert.ok(handle);
    assert.equal(handle.host.parentElement, results);
    if (insert === "append") {
      assert.equal(results.lastElementChild, handle.host);
    } else {
      assert.equal(results.firstElementChild, handle.host);
    }
    handle.destroy();
    window.close();
  }
});
