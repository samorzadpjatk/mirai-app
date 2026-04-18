// =============================================================================
// Generated Operations (Placeholder)
// =============================================================================

/**
 * This is a placeholder file.
 *
 * Run `bun run --filter=@mirai-app/frameworks sync:schema` to generate the
 * actual operation types from your GraphQL documents.
 *
 * This file will be overwritten during generation.
 */

import type * as Types from "./types.js";

// Placeholder exports
export type GetUserQueryVariables = Types.Exact<{
  id: Types.Scalars["ID"]["input"];
}>;

export type GetUserQuery = { __typename?: "Query"; me?: Types.Maybe<{ __typename?: "User"; id: string; firstName: string; lastName: string; email?: Types.Maybe<string> }> };

export type GetMyTripsQueryVariables = Types.Exact<{
  pagination?: Types.InputMaybe<{ limit?: Types.InputMaybe<number>; offset?: Types.InputMaybe<number> }>;
}>;

export type GetMyTripsQuery = { __typename?: "Query"; myTrips: { __typename?: "PaginatedTrips"; trips: Array<{ __typename?: "Trip"; id: string; name: string }> } };

export type UpdateMyProfileMutationVariables = Types.Exact<{
  input: { firstName: string; lastName: string };
}>;

export type UpdateMyProfileMutation = { __typename?: "Mutation"; updateMyProfile: { __typename?: "UpdateProfileResult"; id: string; firstName: string; lastName: string } };
