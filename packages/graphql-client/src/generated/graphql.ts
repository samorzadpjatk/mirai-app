// GraphQL Types - Re-exported from urql.ts for compatibility
// This file provides a clean import path for GraphQL types

export type {
  // Query Types
  GetUserQuery,
  GetUserQueryVariables,
  GetCurrentUserQuery,
  GetCurrentUserQueryVariables,
  GetTripQuery,
  GetTripQueryVariables,
  GetTripsQuery,
  GetTripsQueryVariables,

  // Mutation Types
  CreateTripMutation,
  CreateTripMutationVariables,
  UpdateTripMutation,
  UpdateTripMutationVariables,
  DeleteTripMutation,
  DeleteTripMutationVariables,

  // Fragment Types
  UserFieldsFragment,
  TripFieldsFragment,

  // Additional types that might be needed
  TripListResultFieldsFragment,
  UserCreateResultFieldsFragment,
  UserUpdateResultFieldsFragment,
  TripSummaryFieldsFragment,
} from "./urql";

export {
  // Enums (not types)
  UserRole,
  TripStatus,
} from "./urql";
