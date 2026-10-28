import type { Engine } from "@derecherche/data";

const QUERY_PLACEHOLDER = "{q}";

export function normalizeQuery(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateEngineTemplate(engine: Pick<Engine, "id" | "url">): void {
  if (!engine.url.includes(QUERY_PLACEHOLDER)) {
    throw new Error(`Engine ${engine.id} URL is missing ${QUERY_PLACEHOLDER}`);
  }

  const sample = engine.url.replaceAll(QUERY_PLACEHOLDER, "test");
  if (!isHttpUrl(sample)) {
    throw new Error(`Engine ${engine.id} URL must use http or https`);
  }
}

export function buildTargetUrl(engine: Pick<Engine, "id" | "url">, query: string): string {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    throw new Error("Query must not be empty");
  }

  validateEngineTemplate(engine);

  const target = engine.url.replaceAll(
    QUERY_PLACEHOLDER,
    encodeURIComponent(normalized)
  );

  if (!isHttpUrl(target)) {
    throw new Error(`Engine ${engine.id} produced an invalid target URL`);
  }

  return target;
}
