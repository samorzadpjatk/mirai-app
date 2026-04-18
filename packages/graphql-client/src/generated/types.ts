// =============================================================================
// Generated Types (Placeholder)
// =============================================================================

/**
 * This is a placeholder file.
 *
 * Run `bun run --filter=@mirai-app/frameworks sync:schema` to generate the
 * actual types from the GraphQL schema.
 *
 * This file will be overwritten during generation.
 */

// Placeholder exports to prevent TypeScript errors
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };

/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: Date;
  JSON: unknown;
}

// Placeholder types - will be generated
export interface User {
  __typename?: "User";
  id: Scalars["ID"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  email?: Maybe<Scalars["String"]>;
  role: Role;
  hasAvatar: Scalars["Boolean"];
}

export type Role = "USER" | "ADMIN" | "MODERATOR" | "SERVICE";

export interface Trip {
  __typename?: "Trip";
  id: Scalars["ID"];
  name: Scalars["String"];
  description?: Maybe<Scalars["String"]>;
  startDate: Scalars["DateTime"];
  endDate: Scalars["DateTime"];
}

export interface Group {
  __typename?: "Group";
  id: Scalars["ID"];
  name: Scalars["String"];
  coins: Scalars["Int"];
}

export interface Challenge {
  __typename?: "Challenge";
  id: Scalars["ID"];
  name: Scalars["String"];
  status: ChallengeStatus;
}

export type ChallengeStatus = "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED";

export interface Query {
  __typename?: "Query";
  me?: Maybe<User>;
  myTrips: PaginatedTrips;
}

export interface PaginatedTrips {
  __typename?: "PaginatedTrips";
  trips: Trip[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  __typename?: "PaginationInfo";
  total: Scalars["Int"];
  limit: Scalars["Int"];
  offset: Scalars["Int"];
  hasMore: Scalars["Boolean"];
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  currentPage: Scalars["Int"];
  totalPages: Scalars["Int"];
}

export interface Mutation {
  __typename?: "Mutation";
  updateMyProfile: UpdateProfileResult;
  createTrip: CreateTripResult;
}

export interface UpdateProfileResult {
  __typename?: "UpdateProfileResult";
  id: Scalars["ID"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
}

export interface CreateTripResult {
  __typename?: "CreateTripResult";
  id: Scalars["ID"];
  name: Scalars["String"];
}

export interface Subscription {
  __typename?: "Subscription";
  friendLocationEvent?: Maybe<FriendLocationEvent>;
  notificationReceived?: Maybe<Notification>;
}

export interface FriendLocationEvent {
  __typename?: "FriendLocationEvent";
  userId: Scalars["ID"];
  latitude: Scalars["Float"];
  longitude: Scalars["Float"];
}

export interface Notification {
  __typename?: "Notification";
  id: Scalars["ID"];
  title: Scalars["String"];
  body: Scalars["String"];
}
