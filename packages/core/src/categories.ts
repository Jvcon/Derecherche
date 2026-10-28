import type { Category, CategoryChild, Engine } from "@derecherche/data";

export interface FlatCategory {
  category: Category | CategoryChild;
  parentId?: string;
  path: string[];
}

export function flattenCategories(categories: readonly Category[]): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const category of categories) {
    result.push({ category, path: [category.id] });
    for (const child of category.children ?? []) {
      result.push({
        category: child,
        parentId: category.id,
        path: [category.id, child.id],
      });
    }
  }
  return result;
}

export function findCategory(
  categories: readonly Category[],
  id: string
): FlatCategory | undefined {
  return flattenCategories(categories).find((entry) => entry.category.id === id);
}

export function getCategoryPath(
  categories: readonly Category[],
  id: string
): FlatCategory | undefined {
  return findCategory(categories, id);
}

export function getChildCategories(
  categories: readonly Category[],
  parentId: string
): CategoryChild[] {
  const parent = categories.find((category) => category.id === parentId);
  return parent?.children ?? [];
}

export function getEnginesForCategory(
  engines: readonly Engine[],
  categories: readonly Category[],
  categoryId: string
): Engine[] {
  const entry = findCategory(categories, categoryId);
  if (!entry) return [];

  const ids = new Set<string>([categoryId]);
  if ("children" in entry.category) {
    for (const child of entry.category.children ?? []) {
      ids.add(child.id);
    }
  }

  return engines.filter((engine) => ids.has(engine.category));
}
