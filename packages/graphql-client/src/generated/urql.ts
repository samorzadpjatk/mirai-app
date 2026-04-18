// =============================================================================
// Generated urql Hooks (Placeholder)
// =============================================================================

/**
 * This is a placeholder file.
 *
 * Run `bun run --filter=@mirai-app/frameworks sync:schema` to generate the
 * actual urql hooks from your GraphQL documents.
 *
 * This file will be overwritten during generation.
 */

import type * as Types from "./types.js";
import type { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";

// Placeholder document nodes
export const GetUserDocument = {} as DocumentNode<Types.GetUserQuery, Types.GetUserQueryVariables>;
export const GetMyTripsDocument = {} as DocumentNode<Types.GetMyTripsQuery, Types.GetMyTripsQueryVariables>;
export const UpdateMyProfileDocument = {} as DocumentNode<Types.UpdateMyProfileMutation, Types.UpdateMyProfileMutationVariables>;

// Placeholder hooks
export function useGetUserQuery(options: Omit<import("urql").UseQueryArgs<Types.GetUserQueryVariables>, "query">) {
  return [{ data: undefined, fetching: false, error: undefined, stale: false }] as const;
}

export function useGetMyTripsQuery(options?: Omit<import("urql").UseQueryArgs<Types.GetMyTripsQueryVariables>, "query">) {
  return [{ data: undefined, fetching: false, error: undefined, stale: false }] as const;
}

export function useUpdateMyProfileMutation() {
  return [{ data: undefined, fetching: false, error: undefined }, () => Promise.resolve({ data: undefined, error: undefined })] as const;
}
