import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["exec", "vite", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DERECHERCHE_BUILD: "test",
  },
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const artifact = path.join(root, "dist", "derecherche-test.user.js");
const code = fs.readFileSync(artifact, "utf8");
const catalog = JSON.parse(
  fs.readFileSync(
    path.join(root, "../../packages/data/generated/catalog.json"),
    "utf8"
  )
);

const checks = [
  [code.startsWith("// ==UserScript==\n"), "metadata block"],
  [code.includes("// @name         Derecherche (test)"), "test name"],
  [code.includes("// @version      0.1.0-test."), "test version"],
  [code.includes("// @grant        GM_getValue"), "GM_getValue grant"],
  [code.includes("// @grant        GM_setValue"), "GM_setValue grant"],
  [code.includes('id="derecherche-inline-bar"') || code.includes("derecherche-inline-bar"), "InlineBar"],
  [fs.statSync(artifact).size < 250_000, "size budget"],
];

for (const host of new Set(catalog.sites.flatMap((site) => site.hosts))) {
  checks.push([
    code.includes(`// @match        *://${host}/*`),
    `@match ${host}`,
  ]);
}

const failures = checks.filter(([passed]) => !passed).map(([, label]) => label);
if (failures.length > 0) {
  console.error(`Test build verification failed: ${failures.join(", ")}`);
  process.exit(1);
}

const size = (fs.statSync(artifact).size / 1024).toFixed(1);
const sha256 = createHash("sha256").update(code).digest("hex");
console.log(`\nTest userscript: ${artifact}`);
console.log(`Size: ${size} KiB`);
console.log(`SHA-256: ${sha256}`);
console.log(`Checks: ${checks.length} passed`);
console.log("The artifact is under dist/ and is ignored by git.");
