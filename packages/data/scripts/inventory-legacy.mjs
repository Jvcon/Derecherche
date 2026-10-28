import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as acorn from "acorn";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const legacyFile = path.resolve(root, "../../legacy/userscript/template.js");
const catalogFile = path.join(root, "generated", "catalog.json");
const reportFile = path.resolve(root, "../../docs/migration/legacy-engines.md");

const DEAD_NAMES = new Set([
  "乐视",
  "搜狐",
  "一听",
  "虾米音乐",
  "音悦Tai",
  "百度音乐",
  "腾讯微博",
  "Google+",
  "1号店",
  "爱问知识",
  "CNKI翻译",
  "汉典",
  "知乎(搜狗)",
  "豆丁文档",
  "easyicon",
]);

const PIRACY_CATEGORY = "download";

const LEGACY_ALIASES = {
  "必应": "bing-web",
  "谷歌图片": "google-images",
  "谷歌学术": "google-scholar",
  "谷歌翻译": "google-translate",
  "知网": "cnki",
  "维基": "wikipedia-zh",
  "亚马逊": "amazon",
};

const TRACKING_PARAMS = new Set([
  "ie",
  "oe",
  "hl",
  "gl",
  "ceid",
  "newwindow",
  "cx",
  "utf8",
  "enc",
  "rs",
  "term_meta",
  "pic",
  "sug",
  "type",
  "from",
  "ref",
  "spm",
]);

const SPECIAL_REASONS = {
  "download:1": "legacy custom Google CSE for downloads; not re-verified",
  "mine:5": "download/movie scope not migrated",
  "mine:6": "download/subtitle scope not migrated",
  "mine:7": "download/game scope not migrated",
  "news:2": "site-specific Baidu query; better represented by a site adapter",
  "news:3": "site-specific Google query; better represented by a site adapter",
  "news:4": "site-specific Sogou query; better represented by a site adapter",
  "news:8": "site-specific Google query; better represented by a site adapter",
  "sociality:0": "login-gated; not selected",
  "sociality:5": "login-gated; not selected",
};


function walk(node, fn) {
  if (!node || typeof node.type !== "string") return;
  fn(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "start" || key === "end" || key === "loc") continue;
    if (Array.isArray(value)) {
      for (const child of value) walk(child, fn);
    } else if (value && typeof value === "object" && typeof value.type === "string") {
      walk(value, fn);
    }
  }
}

function literalName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal") return String(node.value);
  return null;
}

function evalValue(node) {
  if (!node) return undefined;
  if (node.type === "Literal") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked).join("");
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = evalValue(node.left);
    const right = evalValue(node.right);
    if (left !== undefined && right !== undefined) return left + right;
  }
  if (node.type === "UnaryExpression" && node.operator === "-") {
    const arg = evalValue(node.argument);
    if (typeof arg === "number") return -arg;
  }
  return undefined;
}

function normalizeUrl(value) {
  if (typeof value !== "string") return "";
  let url = value.replaceAll("%s", "{q}").trim();
  url = url.replace(/^http:\/\//i, "https://");
  try {
    const parsed = new URL(url.replaceAll("{q}", "test"));
    const params = [...parsed.searchParams]
      .filter(([key]) => !TRACKING_PARAMS.has(key.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b));
    const search = params.length
      ? `?${params.map(([key, item]) => `${key}=${item}`).join("&")}`
      : "";
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}${search}`;
  } catch {
    return url;
  }
}

async function main() {
  const source = await fs.readFile(legacyFile, "utf8");
  const ast = acorn.parse(source, { ecmaVersion: "latest", sourceType: "script" });
  const legacy = [];

  walk(ast, (node) => {
    if (node.type !== "AssignmentExpression" || node.operator !== "=") return;
    const left = node.left;
    if (
      left.type !== "MemberExpression" ||
      left.object.type !== "MemberExpression" ||
      left.object.object.type !== "Identifier" ||
      left.object.object.name !== "engineList"
    ) {
      return;
    }
    const category = literalName(left.object.property);
    const index = evalValue(left.property);
    if (!category || typeof index !== "number" || node.right.type !== "ObjectExpression") {
      return;
    }
    const record = { category, index };
    for (const prop of node.right.properties) {
      if (prop.type !== "Property") continue;
      const key = literalName(prop.key);
      if (!key) continue;
      record[key] = evalValue(prop.value);
    }
    legacy.push(record);
  });

  legacy.sort((a, b) => a.category.localeCompare(b.category) || a.index - b.index);

  const catalog = JSON.parse(await fs.readFile(catalogFile, "utf8"));
  const migratedByLegacy = new Map(
    catalog.engines
      .filter((engine) => engine.legacyId)
      .map((engine) => [engine.legacyId, engine])
  );
  const existingByUrl = new Map(
    catalog.engines.map((engine) => [normalizeUrl(engine.url), engine])
  );
  const existingByName = new Map(
    catalog.engines.map((engine) => [engine.name.toLowerCase(), engine])
  );

  const migrated = [];
  const merged = [];
  const skipped = [];

  for (const engine of legacy) {
    const key = `${engine.category}:${engine.index}`;
    const migratedEngine = migratedByLegacy.get(key);
    if (migratedEngine) {
      migrated.push({ legacy: engine, current: migratedEngine });
      continue;
    }

    const duplicate =
      existingByUrl.get(normalizeUrl(engine.url)) ??
      existingByName.get(String(engine.name ?? "").toLowerCase()) ??
      catalog.engines.find((item) => item.id === LEGACY_ALIASES[engine.name]);
    if (duplicate) {
      merged.push({ legacy: engine, current: duplicate });
      continue;
    }

    let reason = SPECIAL_REASONS[key];
    if (!reason) {
      if (engine.disable) reason = "disabled in legacy defaults and not migrated";
      else if (engine.category === PIRACY_CATEGORY) {
        reason = "download/piracy scope not migrated";
      } else if (DEAD_NAMES.has(engine.name)) reason = "obsolete or dead";
      else if (String(engine.url ?? "").startsWith("http://")) {
        reason = "legacy HTTP URL not re-verified";
      } else {
        reason = "not selected during curation";
      }
    }

    skipped.push({ legacy: engine, reason });
  }

  const lines = [
    "# Legacy engine migration",
    "",
    "Source: `legacy/userscript/template.js`.",
    "",
    "## Summary",
    "",
    `- Legacy base engines found: ${legacy.length}`,
    `- Migrated: ${migrated.length}`,
    `- Merged into existing catalog entries: ${merged.length}`,
    `- Skipped: ${skipped.length}`,
    "- Optional `engineList_plus` packs were inventoried separately and are not part of this migration.",
    "",
    "The migration is curated rather than a blind port. Dead engines, policy-problematic downloads, old HTTP endpoints, and duplicates were not added as active entries. New records include a `legacyId` of `<legacy category>:<legacy index>`.",
    "",
    "## Migrated",
    "",
    "| Legacy id | Legacy name | New engine | New category |",
    "|---|---|---|---|",
    ...migrated.map(
      ({ legacy, current }) =>
        `| ${legacy.category}:${legacy.index} | ${legacy.name} | ${current.name} (\`${current.id}\`) | ${current.category} |`
    ),
    "",
    "## Merged into existing entries",
    "",
    "| Legacy id | Legacy name | Existing engine |",
    "|---|---|---|",
    ...merged.map(
      ({ legacy, current }) =>
        `| ${legacy.category}:${legacy.index} | ${legacy.name} | ${current.name} (\`${current.id}\`) |`
    ),
    "",
    "## Skipped",
    "",
    "| Legacy id | Name | Reason |",
    "|---|---|---|",
    ...skipped.map(
      ({ legacy, reason }) =>
        `| ${legacy.category}:${legacy.index} | ${legacy.name ?? "(unnamed)"} | ${reason} |`
    ),
    "",
    "## Notes",
    "",
    "- Existing catalog entries were not rewritten during this pass.",
    "- Migrated records are integrated into their category files under `packages/data/catalog/engines/` and keep a `legacyId`.",
    "- URLs that were clearly retired were replaced with current endpoints; the original category and index are preserved in `legacyId`.",
    "- Optional `engineList_plus` packs (app stores, ebooks, net disks) remain out of scope until their URLs are reviewed.",
    "",
  ];

  await fs.mkdir(path.dirname(reportFile), { recursive: true });
  await fs.writeFile(reportFile, `${lines.join("\n")}\n`);
  console.log(`Wrote ${reportFile}`);
  console.log(`migrated=${migrated.length} merged=${merged.length} skipped=${skipped.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
