/**
 * GraphQL Client for Seed App
 *
 * Uses urql for type-safe API calls with service account authentication.
 *
 * @module graphql-client
 */

import { createClient, cacheExchange, fetchExchange } from "@urql/core";
import { env } from "./config/env";

// =============================================================================
// GraphQL Endpoint Configuration
// =============================================================================

const GRAPHQL_ENDPOINT = env.graphqlEndpoint;

// =============================================================================
// Service Account Authentication
// =============================================================================

/**
 * Service account authentication headers
 * Uses Supabase service role key for internal service access
 */
const getAuthHeaders = (): Record<string, string> => {
  return {
    Authorization: `Bearer ${env.serviceRoleKey}`,
    "X-Service-Account": "seed",
  };
};

// =============================================================================
// GraphQL Client (urql)
// =============================================================================

/**
 * Typed GraphQL client for seed operations
 * Configured with service account authentication
 */
export const seedUrqlClient = createClient({
  url: GRAPHQL_ENDPOINT,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: {
    headers: getAuthHeaders(),
  },
});

// =============================================================================
// Type Exports
// =============================================================================

export type SeedUrqlClient = typeof seedUrqlClient;

// Re-export types from generated urql for convenience
export type {
  SeedCreateSponsorMutation,
  SeedCreateSponsorMutationVariables,
  SeedLinkSponsorToTripMutation,
  SeedLinkSponsorToTripMutationVariables,
  SeedCreateRewardMutation,
  SeedCreateRewardMutationVariables,
} from "@mirai-app/graphql-client/urql";

// Export the generated documents for seed operations
export {
  SeedCreateSponsorDocument,
  SeedLinkSponsorToTripDocument,
  SeedCreateRewardDocument,
} from "@mirai-app/graphql-client/urql";
