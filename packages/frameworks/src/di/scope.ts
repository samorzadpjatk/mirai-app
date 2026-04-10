/**
 * Request Scoping Utilities
 *
 * Provides utilities for managing request-scoped containers in GraphQL and other
 * request-handling contexts. Integrates with awilix-modular's DIContext for
 * proper dependency lifecycle management.
 *
 * ## Features
 *
 * - Request-scoped container creation
 * - Automatic cleanup on request completion
 * - Drizzle database binding per request
 * - Request ID and user context injection
 *
 * ## Usage
 *
 * ### In GraphQL Context
 *
 * ```typescript
 * export const createGraphQLContext = async (opts) => {
 *   const { db, supabase } = await createContextData(opts);
 *   const scope = createRequestScope({
 *     drizzle: db,
 *     requestId: generateRequestId(),
 *     userContext: opts.user,
 *   });
 *
 *   return {
 *     db,
 *     supabase,
 *     container: scope.container,
 *     dispose: scope.dispose,
 *   };
 * };
 * ```
 *
 * @module scope
 */

import { type AwilixContainer, asValue } from "awilix";
import { getContainer, createChildContainer } from "./container";

// =============================================================================
// Types
// =============================================================================

/**
 * Request scope configuration
 */
export interface RequestScopeConfig {
  /** Drizzle database instance for this request */
  drizzle?: unknown;

  /** Unique request identifier */
  requestId?: string;

  /** Authenticated user context */
  userContext?: {
    userId: string;
    email?: string;
    role?: string;
  } | null;

  /** Additional request-specific values */
  values?: Record<string, unknown>;
}

/**
 * Request scope with container and cleanup
 */
export interface RequestScope {
  /** Scoped container for this request */
  container: AwilixContainer;

  /** Dispose function to clean up resources */
  dispose: () => void;

  /** Request ID for tracking */
  requestId: string;
}

// =============================================================================
// Request Scope Creation
// =============================================================================

/**
 * Create a request-scoped container
 *
 * Creates a child container from root with request-specific bindings.
 * The returned scope includes a dispose function for cleanup.
 *
 * @param config - Request scope configuration
 * @returns Request scope with container and dispose function
 *
 * @example
 * ```typescript
 * const scope = createRequestScope({
 *   drizzle: db,
 *   requestId: "req-123",
 *   userContext: { userId: "user-456", role: "admin" },
 * });
 *
 *   try {
 *   const controller = scope.container.resolve("userController");
 *   return await controller.getById({ id: "123" });
 * } finally {
 *   scope.dispose();
 * }
 * ```
 */
export function createRequestScope(config: RequestScopeConfig): RequestScope {
  const parent = getContainer();
  const container = createChildContainer(parent);
  const requestId = config.requestId || generateRequestId();

  // Register request-scoped values
  const registrations: Record<string, ReturnType<typeof asValue>> = {
    requestId: asValue(requestId),
  };

  if (config.drizzle) {
    registrations.drizzle = asValue(config.drizzle);
  }

  if (config.userContext !== undefined) {
    registrations.userContext = asValue(config.userContext);
  }

  // Register additional values
  if (config.values) {
    for (const [key, value] of Object.entries(config.values)) {
      if (!(key in registrations)) {
        registrations[key] = asValue(value);
      }
    }
  }

  container.register(registrations);

  return {
    container,
    requestId,
    dispose: () => {
      // Clean up scoped container
      // Awilix scopes are automatically garbage collected
      // This is a hook for custom cleanup if needed
    },
  };
}

// =============================================================================
// Scoped Execution
// =============================================================================

/**
 * Execute a function within a request scope
 *
 * Automatically creates a scope, executes the function, and cleans up.
 * Useful for background jobs, webhooks, or manual transaction handling.
 *
 * @param config - Request scope configuration
 * @param fn - Function to execute within the scope
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const result = await withRequestScope(
 *   { drizzle: db, requestId: "batch-123" },
 *   async (scope) => {
 *     const useCase = scope.container.resolve("processBatchUseCase");
 *     return await useCase.execute(batchData);
 *   },
 * );
 * ```
 */
export async function withRequestScope<T>(
  config: RequestScopeConfig,
  fn: (scope: RequestScope) => Promise<T>,
): Promise<T> {
  const scope = createRequestScope(config);

  try {
    return await fn(scope);
  } finally {
    scope.dispose();
  }
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate a unique request ID
 *
 * @returns Unique request identifier
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if a container is a scoped (child) container
 *
 * @param container - Container to check
 * @returns True if container is scoped
 */
export function isScopedContainer(container: AwilixContainer): boolean {
  // Awilix scoped containers have a parent property
  // Access via type assertion since parent is internal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (container as any).parent !== undefined;
}

/**
 * Get the parent container if one exists
 *
 * @param container - Container to check
 * @returns Parent container or null
 */
export function getParentContainer(
  container: AwilixContainer,
): AwilixContainer | null {
  // Access parent via type assertion since it's internal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parent = (container as any).parent;
  return parent || null;
}
