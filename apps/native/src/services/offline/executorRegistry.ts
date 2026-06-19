type MutationExecutor = (variables: unknown) => Promise<unknown>;

const registry = new Map<string, MutationExecutor>();

/**
 * Register a mutation executor for a given mutation key.
 * Overwrites any existing executor for the same key.
 */
export function registerMutationExecutor(key: string, executor: MutationExecutor): void {
  registry.set(key, executor);
}

/**
 * Get the mutation executor for a given mutation key.
 * Returns undefined if no executor is registered.
 */
export function getMutationExecutor(key: string): MutationExecutor | undefined {
  return registry.get(key);
}

/**
 * Unregister a mutation executor.
 */
export function unregisterMutationExecutor(key: string): boolean {
  return registry.delete(key);
}

/**
 * Clear all registered executors. Useful on logout.
 */
export function clearExecutors(): void {
  registry.clear();
}
