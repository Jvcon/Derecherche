import fs from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url));

const catalog = JSON.parse(
  fs.readFileSync(
    resolvePath("../../packages/data/generated/catalog.json"),
    "utf8"
  )
);

const hosts = [...new Set(catalog.sites.flatMap((site) => site.hosts))].sort();
const matches = hosts.map((host) => `// @match        *://${host}/*`).join("\n");

const metadata = `// ==UserScript==
// @name         Derecherche
// @namespace    https://derecherche.dev/
// @version      0.1.0
// @description  Keyboard-first search routing across engines without leaving the result page.
// @author       Jvcon
// @license      GPL-3.0-only
// @homepageURL  https://github.com/Jvcon/Derecherche
// @supportURL   https://github.com/Jvcon/Derecherche/issues
${matches}
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==
`;

export default defineConfig({
  build: {
    target: "es2019",
    emptyOutDir: true,
    minify: "esbuild",
    lib: {
      entry: resolvePath("src/main.ts"),
      name: "Derecherche",
      formats: ["iife"],
      fileName: () => "derecherche.user.js",
    },
  },
  plugins: [
    {
      name: "derecherche-userscript-metadata",
      generateBundle(_options, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === "chunk") {
            chunk.code = metadata + chunk.code;
          }
        }
      },
    },
  ],
});
