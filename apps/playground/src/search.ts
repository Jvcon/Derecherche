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

input.value = query;
queryNode.textContent = query;
count.textContent = `About 1,240 demo results for "${query}"`;

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

injectDemo();
