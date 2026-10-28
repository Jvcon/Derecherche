import { applyCategorySettings, createDefaultSettings } from "@derecherche/core";
import { data } from "./catalog";
import { openPalette } from "./palette";

const settings = createDefaultSettings(data.catalogVersion);
const categories = applyCategorySettings(data.categories, settings);
const queryInput = document.querySelector<HTMLInputElement>("#workbench-query")!;
const categorySelect =
  document.querySelector<HTMLSelectElement>("#workbench-category")!;
const openButton = document.querySelector<HTMLButtonElement>("#workbench-open")!;

const rootOption = document.createElement("option");
rootOption.value = "";
rootOption.textContent = "全部";
categorySelect.append(rootOption);

for (const category of categories) {
  const option = document.createElement("option");
  option.value = category.id;
  option.textContent = category.name;
  categorySelect.append(option);
}

function open(): void {
  openPalette({
    query: queryInput.value.trim(),
    sourceLabel: "workbench",
    categoryId: categorySelect.value || undefined,
  });
}

openButton.addEventListener("click", open);
queryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") open();
});

open();
