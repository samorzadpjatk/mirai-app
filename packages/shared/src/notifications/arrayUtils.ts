export function deduplicateIds<T>(ids: T[]): T[] {
  return Array.from(new Set(ids));
}

export function extractFulfilledValues<T>(results: PromiseSettledResult<T>[]): T[] {
  return results
    .filter((r): r is PromiseFulfilledResult<T> => r.status === "fulfilled")
    .map((r) => r.value);
}
