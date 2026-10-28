import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCategorySettings,
  applySettings,
  buildTargetUrl,
  createDefaultSettings,
  createMemoryStorage,
  extractFromDocument,
  extractFromSelection,
  extractQuery,
  findCategory,
  flattenCategories,
  getEnginesForCategory,
  matchSite,
  normalizeQuery,
  normalizeSettings,
  validateEngineTemplate,
} from "../dist/index.js";

const google = {
  id: "google-web",
  providerId: "google",
  name: "Google",
  category: "web-general",
  url: "https://www.google.com/search?q={q}",
  status: "active",
};

const github = {
  id: "github",
  providerId: "github",
  name: "GitHub",
  category: "dev-code",
  url: "https://github.com/search?q={q}",
  status: "active",
};

const categories = [
  {
    id: "web",
    name: "网页",
    order: 10,
    children: [{ id: "web-general", name: "综合", order: 10 }],
  },
  {
    id: "development",
    name: "开发",
    order: 20,
    children: [{ id: "dev-code", name: "代码托管", order: 10 }],
  },
];

test("normalizeQuery trims and collapses whitespace", () => {
  assert.equal(normalizeQuery("  hello   world \n"), "hello world");
});

test("buildTargetUrl encodes the query", () => {
  assert.equal(
    buildTargetUrl(google, "hello world"),
    "https://www.google.com/search?q=hello%20world"
  );
  assert.equal(
    buildTargetUrl(google, "中文"),
    "https://www.google.com/search?q=%E4%B8%AD%E6%96%87"
  );
});

test("buildTargetUrl rejects empty and unsafe templates", () => {
  assert.throws(() => buildTargetUrl(google, "   "), /empty/);
  assert.throws(
    () => validateEngineTemplate({ id: "bad", url: "javascript:alert(1)?q={q}" }),
    /http/
  );
  assert.throws(
    () => validateEngineTemplate({ id: "bad", url: "https://example.com/search" }),
    /missing/
  );
});

test("default settings are versioned and stable", () => {
  const settings = createDefaultSettings("2026.10.0");
  assert.equal(settings.schemaVersion, 1);
  assert.equal(settings.catalogVersion, "2026.10.0");
  assert.equal(settings.openMode, "new-tab");
  assert.deepEqual(settings.customEngines, []);
});

test("normalizeSettings drops invalid values and sanitizes custom engines", () => {
  const settings = normalizeSettings(
    {
      openMode: "nonsense",
      theme: "dark",
      engines: {
        "google-web": { enabled: false, pinned: true, order: 2, name: "G" },
        bad: { enabled: "yes" },
      },
      customEngines: [
        {
          id: "custom-search",
          providerId: "custom",
          name: "Custom",
          category: "web-general",
          url: "https://example.com/search?q={q}",
          tags: ["custom", "custom"],
        },
        {
          id: "bad-engine",
          providerId: "custom",
          name: "Bad",
          category: "web-general",
          url: "javascript:alert(1)?q={q}",
        },
      ],
    },
    "2026.10.0"
  );

  assert.equal(settings.openMode, "new-tab");
  assert.equal(settings.theme, "dark");
  assert.deepEqual(settings.engines["google-web"], {
    enabled: false,
    pinned: true,
    order: 2,
    name: "G",
  });
  assert.equal(settings.engines.bad, undefined);
  assert.equal(settings.customEngines.length, 1);
  assert.deepEqual(settings.customEngines[0].tags, ["custom"]);
});

test("applySettings filters disabled engines and preserves pinned metadata", () => {
  const settings = normalizeSettings(
    {
      engines: {
        "google-web": { enabled: false },
        github: { pinned: true, order: 1, name: "GitHub Search" },
      },
    },
    "2026.10.0"
  );

  const resolved = applySettings([google, github], settings);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].id, "github");
  assert.equal(resolved[0].name, "GitHub Search");
  assert.equal(resolved[0].pinned, true);
  assert.equal(resolved[0].order, 1);
});

test("applyCategorySettings hides and orders categories", () => {
  const settings = normalizeSettings(
    {
      categories: {
        web: { hidden: true },
        development: { order: 5 },
      },
    },
    "2026.10.0"
  );

  const result = applyCategorySettings(categories, settings);
  assert.deepEqual(result.map((category) => category.id), ["development"]);
});

test("category helpers expose paths and aggregate engines", () => {
  const flat = flattenCategories(categories);
  assert.equal(flat.length, 4);
  assert.deepEqual(findCategory(categories, "dev-code")?.path, [
    "development",
    "dev-code",
  ]);
  assert.deepEqual(
    getEnginesForCategory([google, github], categories, "development").map(
      (engine) => engine.id
    ),
    ["github"]
  );
});

test("memory storage clones values", async () => {
  const storage = createMemoryStorage({ a: { value: 1 } });
  const value = await storage.get("a");
  value.value = 2;
  assert.deepEqual(await storage.get("a"), { value: 1 });

  await storage.set("b", [1, 2]);
  assert.deepEqual(await storage.keys(), ["a", "b"]);
  await storage.remove("a");
  assert.equal(await storage.get("a"), undefined);
  assert.deepEqual(storage.snapshot(), { b: [1, 2] });
});

const sites = [
  {
    id: "google",
    name: "Google Search",
    hosts: ["www.google.com", "*.google.com"],
    urlParams: ["q"],
    selectors: { query: ['input[name="q"]'] },
    defaultCategory: "web-general",
  },
  {
    id: "google-images",
    name: "Google Images",
    hosts: ["www.google.com", "*.google.com"],
    pathPattern: "^/search$",
    paramMatches: { tbm: "isch" },
    priority: 20,
    urlParams: ["q"],
    selectors: { query: ['input[name="q"]'] },
    defaultCategory: "image-search",
  },
  {
    id: "bing",
    name: "Bing",
    hosts: ["www.bing.com"],
    urlParams: ["q"],
    defaultCategory: "web-general",
  },
];

test("matchSite prefers path and param-specific adapters", () => {
  assert.equal(
    matchSite(new URL("https://www.google.com/search?q=test&tbm=isch"), sites)?.id,
    "google-images"
  );
  assert.equal(
    matchSite(new URL("https://www.google.com/search?q=test"), sites)?.id,
    "google"
  );
  assert.equal(
    matchSite(new URL("https://www.bing.com/search?q=test"), sites)?.id,
    "bing"
  );
  assert.equal(matchSite(new URL("https://example.com/?q=test"), sites), undefined);
});

test("extractQuery reads URL params from the matched adapter", () => {
  const result = extractQuery(
    { url: "https://www.google.com/search?q=hello+world" },
    sites
  );
  assert.deepEqual(result, {
    query: "hello world",
    source: "url",
    confidence: 0.95,
    adapterId: "google",
  });
});

test("extractQuery falls back to generic URL params", () => {
  const result = extractQuery({ url: "https://example.com/?query=generic" }, []);
  assert.equal(result?.query, "generic");
  assert.equal(result?.source, "url");
  assert.equal(result?.adapterId, undefined);
});

test("extractQuery reads live DOM values and HTML attributes", () => {
  const liveDocument = {
    querySelector(selector) {
      if (selector !== 'input[name="q"]') return null;
      return { value: "live query", getAttribute: () => null };
    },
  };
  const live = extractQuery(
    { url: "https://www.google.com/search", document: liveDocument },
    sites
  );
  assert.equal(live?.query, "live query");
  assert.equal(live?.source, "searchbox");
  assert.equal(live?.confidence, 0.9);

  const htmlDocument = {
    querySelector(selector) {
      if (selector !== 'input[name="q"]') return null;
      return {
        getAttribute(name) {
          return name === "value" ? "html query" : null;
        },
      };
    },
  };
  const snapshot = extractQuery(
    {
      url: "https://www.google.com/search",
      document: htmlDocument,
      documentKind: "html",
    },
    sites
  );
  assert.equal(snapshot?.query, "html query");
  assert.equal(snapshot?.confidence, 0.85);
});

test("extractFromDocument ignores empty values", () => {
  const document = {
    querySelector() {
      return { value: "   ", getAttribute: () => null, textContent: null };
    },
  };
  assert.equal(extractFromDocument(document, sites[0]), null);
});

test("selection and clipboard are fallbacks", () => {
  const selected = extractQuery(
    { url: "https://example.com/", selection: "  selected   text " },
    []
  );
  assert.equal(selected?.query, "selected text");
  assert.equal(selected?.source, "selection");

  const preferred = extractQuery(
    {
      url: "https://www.google.com/search?q=page+query",
      selection: "selected",
    },
    sites,
    { preferSelection: true }
  );
  assert.equal(preferred?.query, "selected");

  assert.equal(extractFromSelection("a", 2), null);
  assert.equal(extractFromSelection("ab", 2)?.query, "ab");

  const clipboard = extractQuery(
    { url: "https://example.com/", clipboard: "from clipboard" },
    []
  );
  assert.equal(clipboard?.source, "clipboard");
});

test("extractQuery returns null when no query exists", () => {
  assert.equal(extractQuery({ url: "https://example.com/" }, []), null);
});
