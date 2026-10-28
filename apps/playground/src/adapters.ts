import type { Site } from "@derecherche/data";
import { matchSite, resolveMount, type MountResolution } from "@derecherche/core";
import { mountInlineBar, openPalette } from "@derecherche/ui";
import { data } from "./catalog";
import { getFrecency, recordEngineUse } from "./frecency";

interface MountCase {
  name: string;
  remove?: string[];
  selector: string;
  insert: "after" | "before" | "append" | "prepend";
  kind: "container" | "anchor";
}

interface MountFixture {
  url: string;
  query: string;
  cases: MountCase[];
}

const fixtureHtml = import.meta.glob("../../../fixtures/*/mount.html", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const fixtureJson = import.meta.glob("../../../fixtures/*/mount.json", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function siteIdFromPath(path: string): string {
  return path.split("/").at(-2) ?? "";
}

const fixtures = new Map<string, { html: string; data: MountFixture }>();
for (const [path, html] of Object.entries(fixtureHtml)) {
  const id = siteIdFromPath(path);
  const jsonPath = Object.keys(fixtureJson).find(
    (candidate) => siteIdFromPath(candidate) === id
  );
  if (!jsonPath) continue;
  fixtures.set(id, {
    html,
    data: JSON.parse(fixtureJson[jsonPath]) as MountFixture,
  });
}

const siteSelect = document.querySelector<HTMLSelectElement>("#site")!;
const caseSelect = document.querySelector<HTMLSelectElement>("#case")!;
const caseField = document.querySelector<HTMLElement>("#case-field")!;
const urlInput = document.querySelector<HTMLInputElement>("#url")!;
const summary = document.querySelector<HTMLElement>("#summary")!;
const result = document.querySelector<HTMLElement>("#result")!;
const attemptsNode = document.querySelector<HTMLElement>("#attempts")!;
const fixtureNode = document.querySelector<HTMLElement>("#fixture-html")!;
const pasteInput = document.querySelector<HTMLTextAreaElement>("#paste")!;
const preview = document.querySelector<HTMLIFrameElement>("#preview")!;
const previewStatus = document.querySelector<HTMLElement>("#preview-status")!;
const runFixture = document.querySelector<HTMLButtonElement>("#run-fixture")!;
const runPaste = document.querySelector<HTMLButtonElement>("#run-paste")!;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function selectedSite(): Site {
  const site = data.sites.find((candidate) => candidate.id === siteSelect.value);
  if (!site) throw new Error("Unknown site adapter");
  return site;
}

function selectedFixture(): { html: string; data: MountFixture } | undefined {
  return fixtures.get(siteSelect.value);
}

function renderSummary(): void {
  const site = selectedSite();
  const fixture = selectedFixture();
  const match = (() => {
    try {
      return matchSite(new URL(urlInput.value), data.sites);
    } catch {
      return undefined;
    }
  })();

  const rules = site.mount?.rules ?? [];
  summary.innerHTML = `
    <dl>
      <dt>Hosts</dt><dd>${site.hosts.map(escapeHtml).join(", ")}</dd>
      <dt>Path regex</dt><dd><code>${escapeHtml(site.pathPattern ?? "—")}</code></dd>
      <dt>Param matches</dt><dd><code>${escapeHtml(
        JSON.stringify(site.paramMatches ?? {})
      )}</code></dd>
      <dt>Matched URL</dt><dd>${
        match ? `<strong>${escapeHtml(match.id)}</strong>` : "no match"
      }</dd>
      <dt>Rules</dt><dd><pre>${escapeHtml(JSON.stringify(rules, null, 2))}</pre></dd>
    </dl>
  `;

  fixtureNode.textContent = fixture?.html ?? "No fixture for this adapter.";
  caseField.hidden = !fixture;
  caseSelect.innerHTML = "";
  for (const [index, testCase] of (fixture?.data.cases ?? []).entries()) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = testCase.name;
    caseSelect.append(option);
  }
}

function renderAttempts(resolution: MountResolution<Element>): void {
  attemptsNode.innerHTML = `
    <table>
      <thead><tr><th>Selector</th><th>Kind</th><th>Source</th><th>Result</th></tr></thead>
      <tbody>
        ${resolution.attempts
          .map(
            (attempt) => `<tr>
              <td><code>${escapeHtml(attempt.selector)}</code></td>
              <td>${attempt.kind}</td>
              <td>${attempt.source}</td>
              <td>${
                attempt.found
                  ? "found"
                  : attempt.error
                    ? `error: ${escapeHtml(attempt.error)}`
                    : "miss"
              }</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderResult(
  status: "pass" | "fail" | "info",
  title: string,
  details: string,
  resolution: MountResolution<Element>
): void {
  result.hidden = false;
  result.className = `adapter-result ${status}`;
  result.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(details)}</p>
    <p>Target: <code>${escapeHtml(
      resolution.target ? `${resolution.target.selector} (${resolution.target.insert})` : "none"
    )}</code></p>
  `;
  renderAttempts(resolution);
  previewStatus.textContent =
    status === "pass" ? "Fixture mounted" : "Resolver returned a result";
}

function verify(
  testCase: MountCase | undefined,
  resolution: MountResolution<Element>,
  mounted: boolean
): void {
  if (!testCase) {
    renderResult(
      mounted ? "info" : "fail",
      mounted ? "Resolved from pasted HTML" : "No mount target",
      mounted
        ? "The InlineBar was mounted in the preview."
        : "The resolver did not find a container or anchor.",
      resolution
    );
    return;
  }

  const checks = [
    resolution.target?.selector === testCase.selector,
    resolution.target?.insert === testCase.insert,
    resolution.target?.kind === testCase.kind,
    mounted,
  ];
  const passed = checks.every(Boolean);
  renderResult(
    passed ? "pass" : "fail",
    passed ? "PASS" : "FAIL",
    passed
      ? `${testCase.name}: ${testCase.selector} (${testCase.insert})`
      : `Expected ${testCase.selector} (${testCase.insert}, ${testCase.kind}); mounted=${mounted}`,
    resolution
  );
}

function loadPreview(
  html: string,
  testCase: MountCase | undefined
): void {
  const site = selectedSite();
  const fixture = selectedFixture();
  const url = urlInput.value.trim() || fixture?.data.url || "";
  const query =
    fixture?.data.query ||
    new URL(url, window.location.href).searchParams.get("q") ||
    "derecherche";

  const matched = (() => {
    try {
      return matchSite(new URL(url), data.sites);
    } catch {
      return undefined;
    }
  })();

  preview.onload = () => {
    const doc = preview.contentDocument;
    if (!doc) {
      result.hidden = false;
      result.className = "adapter-result fail";
      result.textContent = "Cannot access the preview document.";
      return;
    }

    for (const selector of testCase?.remove ?? []) {
      doc.querySelector(selector)?.remove();
    }

    const before = resolveMount(doc, matched ?? site);
    let liveResolution = before;
    let mounted = false;

    try {
      const handle = mountInlineBar({
        catalog: data,
        sites: data.sites,
        query,
        url,
        document: doc,
        frecency: getFrecency(),
        onEngineOpened: recordEngineUse,
        onResolve: (resolution) => {
          liveResolution = resolution;
        },
        onMore: (context) => {
          openPalette({
            catalog: data,
            query: context.query,
            categoryId: context.categoryId,
            focusCategory: Boolean(context.categoryId),
            frecency: getFrecency(),
            onEngineOpened: recordEngineUse,
          });
        },
      });
      mounted = Boolean(handle);
    } catch (error) {
      result.hidden = false;
      result.className = "adapter-result fail";
      result.textContent = `Mount failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      renderAttempts(liveResolution);
      return;
    }

    verify(testCase, liveResolution, mounted);
  };

  preview.srcdoc = html;
}

siteSelect.addEventListener("change", () => {
  const fixture = selectedFixture();
  if (fixture) urlInput.value = fixture.data.url;
  renderSummary();
  if (fixture) loadPreview(fixture.html, fixture.data.cases[0]);
});

caseSelect.addEventListener("change", () => {
  const fixture = selectedFixture();
  const testCase = fixture?.data.cases[Number(caseSelect.value)];
  if (fixture && testCase) loadPreview(fixture.html, testCase);
});

runFixture.addEventListener("click", () => {
  const fixture = selectedFixture();
  if (!fixture) return;
  const testCase = fixture.data.cases[Number(caseSelect.value)];
  loadPreview(fixture.html, testCase);
});

runPaste.addEventListener("click", () => {
  const html = pasteInput.value.trim();
  if (!html) {
    result.hidden = false;
    result.className = "adapter-result fail";
    result.textContent = "Paste page HTML first.";
    return;
  }
  loadPreview(html, undefined);
});

for (const site of [...data.sites].sort((a, b) => a.id.localeCompare(b.id))) {
  const option = document.createElement("option");
  option.value = site.id;
  option.textContent = `${site.id} — ${site.name}`;
  siteSelect.append(option);
}

siteSelect.value = fixtures.has("google") ? "google" : data.sites[0].id;
const initial = selectedFixture();
if (initial) urlInput.value = initial.data.url;
renderSummary();
if (initial) loadPreview(initial.html, initial.data.cases[0]);
