import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import * as simpleIcons from "simple-icons";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogDir = path.join(root, "catalog");
const generatedDir = path.join(root, "generated");
const iconsDir = path.join(catalogDir, "icons");

const providersDoc = YAML.parse(
  await fs.readFile(path.join(catalogDir, "providers.yaml"), "utf8")
);
const categoriesDoc = YAML.parse(
  await fs.readFile(path.join(catalogDir, "categories.yaml"), "utf8")
);
const mapping = YAML.parse(
  await fs.readFile(path.join(iconsDir, "simple-icons.yaml"), "utf8")
);

const bySlug = new Map();
for (const value of Object.values(simpleIcons)) {
  if (value && typeof value === "object" && typeof value.slug === "string") {
    bySlug.set(value.slug, value);
  }
}

const providerIds = new Set(providersDoc.providers.map((provider) => provider.id));
for (const providerId of Object.keys(mapping.icons ?? {})) {
  if (!providerIds.has(providerId)) {
    throw new Error(`Icon mapping references unknown provider: ${providerId}`);
  }
}

const selected = {};
const missing = [];
for (const provider of providersDoc.providers) {
  const slug = mapping.icons?.[provider.id];
  if (!slug) {
    missing.push(provider.id);
    continue;
  }

  const icon = bySlug.get(slug);
  if (!icon) {
    throw new Error(`Simple Icons has no icon with slug "${slug}" for provider ${provider.id}`);
  }

  selected[provider.id] = {
    symbol: `si-${slug}`,
    slug,
    title: icon.title,
    path: icon.path,
  };
}

const symbols = Object.values(selected)
  .map(
    (icon) =>
      `  <symbol id="${icon.symbol}" viewBox="0 0 24 24"><title>${icon.title}</title><path d="${icon.path}"/></symbol>`
  )
  .join("\n");

const sprite = `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`;

const manifest = {
  schemaVersion: 1,
  catalogVersion: categoriesDoc.catalogVersion,
  sprite: "icons.svg",
  source: mapping.source,
  sourceUrl: mapping.sourceUrl,
  license: mapping.license,
  icons: Object.fromEntries(
    Object.entries(selected).map(([providerId, icon]) => [
      providerId,
      {
        symbol: icon.symbol,
        slug: icon.slug,
        title: icon.title,
      },
    ])
  ),
  missing: missing.sort(),
};

await fs.mkdir(generatedDir, { recursive: true });
await Promise.all([
  fs.writeFile(path.join(generatedDir, "icons.svg"), sprite),
  fs.writeFile(
    path.join(generatedDir, "icons.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  ),
]);

console.log("Icon build passed.");
console.log(`  mapped:  ${Object.keys(selected).length}`);
console.log(`  missing: ${missing.length} (letter-mark fallback)`);
