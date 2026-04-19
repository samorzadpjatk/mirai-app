// @ts-nocheck
// =============================================================================
// Placeholder urql Types
// =============================================================================

/**
 * Placeholder types for urql hooks.
 *
 * These will be replaced by actual types from @urql/react when the
 * GraphQL client is generated.
 */

export interface UseQueryArgs<Variables> {
  query: unknown;
  variables?: Variables;
}

export interface UseQueryResponse<Data, Variables> {
  data?: Data;
  fetching: boolean;
  error?: Error;
  extensions?: Record<string, unknown>;
  stale: boolean;
}

export interface UseMutationState<Data> {
  data?: Data;
  fetching: boolean;
  error?: Error;
  extensions?: Record<string, unknown>;
  stale: boolean;
}

export interface UseSubscriptionArgs<Variables> {
  query: unknown;
  variables?: Variables;
}

export type SubscriptionHandler<Data, Variables> = (
  prev: Data | undefined,
  data: Data
) => Data;

export interface UseSubscriptionResponse<Data, Variables> {
  data?: Data;
  fetching: boolean;
  error?: Error;
  extensions?: Record<string, unknown>;
  stale: boolean;
}
