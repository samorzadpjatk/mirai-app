interface Resolver<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const resolvers = new Map<string, Resolver<unknown>>();

const RESOLVER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Register a promise resolver for a queued mutation.
 * The resolver will be called when the queue processor finishes the mutation.
 * Automatically times out after 5 minutes to prevent memory leaks.
 */
export function registerResolver<T>(
  id: string,
  resolve: (value: T) => void,
  reject: (error: Error) => void,
): void {
  const timeout = setTimeout(() => {
    reject(new Error("Mutation sync timed out — will retry on next sync"));
    resolvers.delete(id);
  }, RESOLVER_TIMEOUT_MS);

  resolvers.set(id, { resolve, reject, timeout });
}

/**
 * Resolve a queued mutation promise with the server result.
 */
export function resolveMutation<T>(id: string, result: T): void {
  const resolver = resolvers.get(id);
  if (!resolver) return;

  clearTimeout(resolver.timeout);
  resolver.resolve(result);
  resolvers.delete(id);
}

/**
 * Reject a queued mutation promise when it permanently fails.
 */
export function rejectMutation(id: string, error: Error): void {
  const resolver = resolvers.get(id);
  if (!resolver) return;

  clearTimeout(resolver.timeout);
  resolver.reject(error);
  resolvers.delete(id);
}

/**
 * Clear all pending resolvers. Useful on app restart or logout.
 */
export function clearResolvers(): void {
  for (const [, resolver] of resolvers) {
    clearTimeout(resolver.timeout);
  }
  resolvers.clear();
}
