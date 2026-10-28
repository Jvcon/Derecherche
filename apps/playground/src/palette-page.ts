import {
  applyCategorySettings,
  createDefaultSettings,
  flattenCategories,
} from "@derecherche/core";
import { data } from "./catalog";
import { openPalette } from "@derecherche/ui";

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

for (const entry of flattenCategories(categories)) {
  const option = document.createElement("option");
  option.value = entry.category.id;
  option.textContent = entry.parentId
    ? `— ${entry.category.name}`
    : entry.category.name;
  categorySelect.append(option);
}

function open(): void {
  openPalette({
    catalog: data,
    query: queryInput.value.trim(),
    sourceLabel: "workbench",
    categoryId: categorySelect.value || undefined,
    focusCategory: Boolean(categorySelect.value),
  });
}

openButton.addEventListener("click", open);
categorySelect.addEventListener("change", open);
queryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") open();
});
