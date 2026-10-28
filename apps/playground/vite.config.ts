import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const resolvePath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@derecherche/core": resolvePath("../../packages/core/dist/index.js"),
      "@derecherche/ui": resolvePath("../../packages/ui/dist/index.js"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        index: resolvePath("index.html"),
        search: resolvePath("search.html"),
        article: resolvePath("article.html"),
        palette: resolvePath("palette.html"),
      },
    },
  },
});
