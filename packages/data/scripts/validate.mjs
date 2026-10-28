import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import YAML from "yaml";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogDir = path.join(root, "catalog");
const schemaDir = path.join(root, "schema");

const errors = [];

const fail = (message) => errors.push(message);

async function readYaml(file) {
  return YAML.parse(await fs.readFile(file, "utf8"));
}

async function listYaml(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function formatAjvErrors(file, validate) {
  return (validate.errors ?? [])
    .map((error) => `${file}${error.instancePath || "/"} ${error.message}`)
    .join("\n");
}

function collectCategoryIds(categories) {
  const ids = [];
  for (const category of categories) {
    ids.push(category.id);
    for (const child of category.children ?? []) {
      ids.push(child.id);
    }
  }
  return ids;
}

function checkUnique(label, values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      fail(`${label} duplicate id: ${value}`);
    }
    seen.add(value);
  }
}

function checkUrl(engine, file) {
  if (!engine.url.includes("{q}")) {
    fail(`${file}: engine ${engine.id} URL is missing {q}`);
    return;
  }

  let url;
  try {
    url = new URL(engine.url.replaceAll("{q}", "test"));
  } catch {
    fail(`${file}: engine ${engine.id} URL is not a valid URL: ${engine.url}`);
    return;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    fail(`${file}: engine ${engine.id} URL must use http or https: ${engine.url}`);
  }
}

async function main() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });

  const categoriesSchema = JSON.parse(
    await fs.readFile(path.join(schemaDir, "categories.schema.json"), "utf8")
  );
  const providersSchema = JSON.parse(
    await fs.readFile(path.join(schemaDir, "providers.schema.json"), "utf8")
  );
  const enginesSchema = JSON.parse(
    await fs.readFile(path.join(schemaDir, "engines.schema.json"), "utf8")
  );
  const sitesSchema = JSON.parse(
    await fs.readFile(path.join(schemaDir, "sites.schema.json"), "utf8")
  );

  const validateCategories = ajv.compile(categoriesSchema);
  const validateProviders = ajv.compile(providersSchema);
  const validateEngines = ajv.compile(enginesSchema);
  const validateSite = ajv.compile(sitesSchema);

  const categoriesFile = path.join(catalogDir, "categories.yaml");
  const categoriesDoc = await readYaml(categoriesFile);
  if (!validateCategories(categoriesDoc)) {
    fail(formatAjvErrors(categoriesFile, validateCategories));
  }

  const catalogVersions = new Set([categoriesDoc.catalogVersion]);
  const schemaVersions = new Set([categoriesDoc.schemaVersion]);

  const providersFile = path.join(catalogDir, "providers.yaml");
  const providersDoc = await readYaml(providersFile);
  if (!validateProviders(providersDoc)) {
    fail(formatAjvErrors(providersFile, validateProviders));
  }

  catalogVersions.add(providersDoc.catalogVersion);
  schemaVersions.add(providersDoc.schemaVersion);

  const categoryIds = collectCategoryIds(categoriesDoc.categories ?? []);
  const providerIds = (providersDoc.providers ?? []).map((provider) => provider.id);

  checkUnique("category", categoryIds);
  checkUnique("provider", providerIds);

  const engines = [];
  const engineFiles = await listYaml(path.join(catalogDir, "engines"));
  for (const file of engineFiles) {
    const doc = await readYaml(file);
    if (!validateEngines(doc)) {
      fail(formatAjvErrors(file, validateEngines));
      continue;
    }

    catalogVersions.add(doc.catalogVersion);
    schemaVersions.add(doc.schemaVersion);

    for (const engine of doc.engines) {
      engines.push({ ...engine, __file: path.basename(file) });
      checkUrl(engine, path.basename(file));
      if (!providerIds.includes(engine.providerId)) {
        fail(`${path.basename(file)}: engine ${engine.id} references unknown provider ${engine.providerId}`);
      }
      if (!categoryIds.includes(engine.category)) {
        fail(`${path.basename(file)}: engine ${engine.id} references unknown category ${engine.category}`);
      }
    }
  }

  checkUnique("engine", engines.map((engine) => engine.id));
  const engineIds = new Set(engines.map((engine) => engine.id));

  if (catalogVersions.size !== 1) {
    fail(`catalogVersion must match across all catalog files: ${[...catalogVersions].join(", ")}`);
  }
  if (schemaVersions.size !== 1) {
    fail(`schemaVersion must match across all catalog files: ${[...schemaVersions].join(", ")}`);
  }

  for (const engine of engines) {
    if (engine.replacedBy && !engineIds.has(engine.replacedBy)) {
      fail(`${engine.__file}: engine ${engine.id} replacedBy unknown engine ${engine.replacedBy}`);
    }
  }

  const urls = new Map();
  for (const engine of engines) {
    if (urls.has(engine.url)) {
      fail(
        `${engine.__file}: engine ${engine.id} duplicates URL from ${urls.get(engine.url)}: ${engine.url}`
      );
    } else {
      urls.set(engine.url, engine.id);
    }
  }

  const sites = [];
  const siteFiles = await listYaml(path.join(catalogDir, "sites"));
  for (const file of siteFiles) {
    const site = await readYaml(file);
    if (!validateSite(site)) {
      fail(formatAjvErrors(file, validateSite));
      continue;
    }
    sites.push(site);
    if (!categoryIds.includes(site.defaultCategory)) {
      fail(`${path.basename(file)}: site ${site.id} references unknown defaultCategory ${site.defaultCategory}`);
    }
    if (site.pathPattern) {
      try {
        new RegExp(site.pathPattern);
      } catch {
        fail(`${path.basename(file)}: site ${site.id} has an invalid pathPattern: ${site.pathPattern}`);
      }
    }
  }

  checkUnique("site", sites.map((site) => site.id));

  const activeEngines = engines.filter((engine) => (engine.status ?? "active") === "active");
  const brokenEngines = engines.filter((engine) => engine.status === "broken");
  const deprecatedEngines = engines.filter((engine) => engine.status === "deprecated");

  if (errors.length > 0) {
    console.error("\nCatalog validation failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log("Catalog validation passed.");
  console.log(`  categories: ${categoryIds.length}`);
  console.log(`  providers:  ${providerIds.length}`);
  console.log(`  engines:    ${engines.length} (${activeEngines.length} active, ${deprecatedEngines.length} deprecated, ${brokenEngines.length} broken)`);
  console.log(`  sites:      ${sites.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
