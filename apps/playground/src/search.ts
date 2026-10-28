import { matchSite } from "@derecherche/core";
import { data } from "./catalog";
import { injectDemo } from "./inject";

const params = new URLSearchParams(window.location.search);
const query = params.get("q")?.trim() || "rust async";
const input = document.querySelector<HTMLInputElement>("#q")!;
const form = document.querySelector<HTMLFormElement>("#search-form")!;
const count = document.querySelector<HTMLElement>("#result-count")!;
const queryNode = document.querySelector<HTMLElement>("#query")!;
const adapterNode = document.querySelector<HTMLElement>("#adapter")!;

function renderQuery(value: string): void {
  input.value = value;
  queryNode.textContent = value;
  count.textContent = `About 1,240 demo results for "${value}"`;
}

renderQuery(query);

const simulatedUrl = new URL("https://www.google.com/search");
simulatedUrl.searchParams.set("q", query);
adapterNode.textContent =
  matchSite(simulatedUrl, data.sites)?.id ?? "generic";

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const next = new URL(window.location.href);
  if (input.value.trim()) {
    next.searchParams.set("q", input.value.trim());
  } else {
    next.searchParams.delete("q");
  }
  window.location.href = next.href;
});

const spaButton = document.querySelector<HTMLButtonElement>("#spa-query");
spaButton?.addEventListener("click", () => {
  const next = `${input.value.trim() || "rust"} spa`;
  const url = new URL(window.location.href);
  url.searchParams.set("q", next);
  window.history.pushState({}, "", url);
  renderQuery(next);
  window.dispatchEvent(new Event("derecherche:querychange"));
});

injectDemo();
