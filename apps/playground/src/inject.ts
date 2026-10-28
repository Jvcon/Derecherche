import { extractQuery, matchSite } from "@derecherche/core";
import { data } from "./catalog";
import { openPalette } from "@derecherche/ui";

const BUTTON_CSS = `
.dr-demo-launcher,
.dr-demo-selection {
  position: fixed;
  z-index: 2147483000;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: #1f2328;
  color: #ffffff;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  font: 600 13px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding: 10px 14px;
  cursor: pointer;
}
.dr-demo-launcher:hover,
.dr-demo-selection:hover {
  background: #0969da;
}
.dr-demo-launcher {
  right: 20px;
  bottom: 20px;
}
.dr-demo-selection {
  right: auto;
  bottom: auto;
  padding: 7px 11px;
  font-size: 12px;
}
`;

function resolveUrl(): string {
  const demoBase = document.body.dataset.demoUrl;
  if (!demoBase) return window.location.href;

  const pageUrl = new URL(window.location.href);
  const query =
    pageUrl.searchParams.get("q") ??
    document.querySelector<HTMLInputElement>('input[name="q"]')?.value ??
    "";
  const url = new URL(demoBase);
  if (query) url.searchParams.set("q", query);
  return url.href;
}

function currentResult() {
  const selection = window.getSelection()?.toString();
  return extractQuery(
    {
      url: resolveUrl(),
      document,
      documentKind: "dom",
      selection,
    },
    data.sites,
    { preferSelection: Boolean(selection?.trim()) }
  );
}

function currentCategory(): string | undefined {
  return matchSite(new URL(resolveUrl()), data.sites)?.defaultCategory;
}

function installStyles(): void {
  const style = document.createElement("style");
  style.dataset.derechercheDemo = "";
  style.textContent = BUTTON_CSS;
  document.head.append(style);
}

export function injectDemo(): void {
  installStyles();

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "dr-demo-launcher";
  launcher.textContent = "Derecherche";
  launcher.title = "Open the Palette (Alt+J)";
  document.body.append(launcher);

  const selectionButton = document.createElement("button");
  selectionButton.type = "button";
  selectionButton.className = "dr-demo-selection";
  selectionButton.textContent = "Search selection";
  selectionButton.hidden = true;
  document.body.append(selectionButton);

  let selectedText = "";
  let selectionTimer: number | undefined;

  function hideSelection(): void {
    selectionButton.hidden = true;
    selectedText = "";
  }

  function showSelection(): void {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    const active = document.activeElement;
    const editable =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLElement && active.isContentEditable);

    if (text.length < 2 || editable || !selection || selection.rangeCount === 0) {
      hideSelection();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      hideSelection();
      return;
    }

    selectedText = text;
    selectionButton.hidden = false;
    const width = 150;
    const left = Math.max(
      8,
      Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2)
    );
    const top = rect.top > 52 ? rect.top - 38 : rect.bottom + 8;
    selectionButton.style.left = `${Math.round(left)}px`;
    selectionButton.style.top = `${Math.round(top)}px`;
  }

  function scheduleSelection(): void {
    window.clearTimeout(selectionTimer);
    selectionTimer = window.setTimeout(showSelection, 180);
  }

  launcher.addEventListener("click", () => {
    const result = currentResult();
    openPalette({
      catalog: data,
      query: result?.query ?? "",
      sourceLabel: result?.source ?? "manual",
      categoryId: currentCategory(),
    });
  });

  selectionButton.addEventListener("click", () => {
    const text = selectedText;
    hideSelection();
    if (!text) return;
    openPalette({
      catalog: data,
      query: text,
      sourceLabel: "selection",
      categoryId: currentCategory() ?? "web-general",
    });
  });

  document.addEventListener("selectionchange", scheduleSelection);
  document.addEventListener("mouseup", scheduleSelection);
  window.addEventListener("scroll", hideSelection, true);
  window.addEventListener("resize", hideSelection);
  document.addEventListener("mousedown", (event) => {
    if (!(event.target instanceof Node)) return;
    if (!selectionButton.contains(event.target)) hideSelection();
  });

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.altKey && event.key.toLowerCase() === "j") {
        event.preventDefault();
        const result = currentResult();
        openPalette({
          catalog: data,
          query: result?.query ?? "",
          sourceLabel: result?.source ?? "manual",
          categoryId: currentCategory(),
        });
      }
    },
    true
  );
}
