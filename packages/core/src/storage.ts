import type { StoragePort } from "./types.js";

export interface MemoryStorage extends StoragePort {
  snapshot(): Record<string, unknown>;
}

export function createMemoryStorage(
  initial: Record<string, unknown> = {}
): MemoryStorage {
  const data = new Map<string, unknown>(
    Object.entries(initial).map(([key, value]) => [key, structuredClone(value)])
  );

  return {
    async get<T>(key: string): Promise<T | undefined> {
      if (!data.has(key)) return undefined;
      return structuredClone(data.get(key)) as T;
    },
    async set<T>(key: string, value: T): Promise<void> {
      data.set(key, structuredClone(value));
    },
    async remove(key: string): Promise<void> {
      data.delete(key);
    },
    async keys(): Promise<string[]> {
      return [...data.keys()].sort();
    },
    snapshot(): Record<string, unknown> {
      return Object.fromEntries(
        [...data.entries()].map(([key, value]) => [key, structuredClone(value)])
      );
    },
  };
}
