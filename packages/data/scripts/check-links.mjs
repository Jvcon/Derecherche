import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogPath = path.join(root, "generated", "catalog.json");
const strict = process.argv.includes("--strict");
const concurrency = Number(process.env.LINK_CHECK_CONCURRENCY ?? 6);
const timeoutMs = Number(process.env.LINK_CHECK_TIMEOUT_MS ?? 10000);

const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const engines = catalog.engines.filter(
  (engine) => (engine.status ?? "active") === "active"
);

async function check(engine) {
  const url = engine.url.replaceAll("{q}", "test");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Derecherche catalog link check",
      },
    });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Derecherche catalog link check",
          range: "bytes=0-0",
        },
      });
    }

    return {
      id: engine.id,
      url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      blocked: [401, 403, 429].includes(response.status),
    };
  } catch (error) {
    return {
      id: engine.id,
      url,
      status: null,
      ok: false,
      blocked: false,
      error: error.name === "AbortError" ? "timeout" : String(error.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
let cursor = 0;

async function worker() {
  while (cursor < engines.length) {
    const index = cursor++;
    results[index] = await check(engines[index]);
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, engines.length) }, worker));

const ok = results.filter((result) => result.ok);
const blocked = results.filter((result) => !result.ok && result.blocked);
const broken = results.filter((result) => !result.ok && !result.blocked);
const lines = [
  "## Catalog link check",
  "",
  `Checked ${results.length} active engines. ${ok.length} reachable, ${blocked.length} blocked by bot protection, ${broken.length} broken.`,
  "",
];

if (blocked.length > 0) {
  lines.push("### Blocked by bot protection", "", "| Engine | Status | URL |", "|---|---|---|");
  for (const item of blocked) {
    lines.push(`| ${item.id} | ${item.status} | ${item.url} |`);
  }
  lines.push("");
}

if (broken.length > 0) {
  lines.push("### Broken or unreachable", "", "| Engine | Status | URL |", "|---|---|---|");
  for (const item of broken) {
    lines.push(`| ${item.id} | ${item.status ?? item.error ?? "error"} | ${item.url} |`);
  }
} else {
  lines.push("No broken engine URLs were detected.");
}

const report = `${lines.join("\n")}\n`;
await fs.writeFile(path.join(root, "generated", "link-check.md"), report);
console.log(report);

if (strict && broken.length > 0) {
  process.exit(1);
}
