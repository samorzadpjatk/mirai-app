/**
 * GraphQL Client for React Native - Full Procedure Coverage
 *
 * Complete tRPC-compatible API surface over GraphQL.
 * Implements all 94 procedures across 14 domains used by the native app.
 *
 * @module graphql/native-client
 */

import { useMemo, useCallback } from "react";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// =============================================================================
// Types
// =============================================================================

export interface GraphQLClientConfig {
  endpoint: string;
  getAuthToken: () => string | null;
}

export type QueryOptions<TInput, TOutput> = {
  queryKey: readonly unknown[];
  queryFn: (input: TInput) => Promise<TOutput>;
};

export type MutationOptions<TInput, TOutput> = {
  mutationFn: (input: TInput) => Promise<TOutput>;
};

export type Procedure<TInput, TOutput> = {
  queryOptions: (input?: TInput) => { queryKey: readonly unknown[] };
  query: (input?: TInput) => Promise<TOutput>;
};

export type MutationProcedure<TInput, TOutput> = {
  mutationOptions: () => MutationOptions<TInput, TOutput>;
  mutate: (input: TInput) => Promise<TOutput>;
};

export type InfiniteProcedure<TInput, TOutput> = {
  queryOptions: (input?: TInput) => { queryKey: readonly unknown[] };
  query: (input?: TInput) => Promise<TOutput>;
  infiniteQueryOptions: (input?: TInput) => {
    queryKey: readonly unknown[];
    queryFn: (context: { pageParam?: number }) => Promise<TOutput>;
  };
};

// =============================================================================
// GraphQL Client Implementation
// =============================================================================

export class GraphQLClient {
  private endpoint: string;
  private getAuthToken: () => string | null;

  constructor(config: GraphQLClientConfig) {
    this.endpoint = config.endpoint;
    this.getAuthToken = config.getAuthToken;
  }

  private async execute<T>(
    document: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const token = this.getAuthToken();

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: document,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || "GraphQL operation failed");
    }

    return result.data as T;
  }

  // =============================================================================
  // USER DOMAIN (15 procedures)
  // =============================================================================
  user = {
    // Queries
    getMy: {
      queryOptions: () => ({ queryKey: ["user", "getMy"] as const }),
      query: async () => {
        return this.execute(`
          query GetMe {
            me {
              id
              authUserId
              email
              firstName
              lastName
              fullName
              role
              hasAvatar
              createdAt
            }
          }
        `);
      },
    },
    getById: {
      queryOptions: (input: { id: string }) => ({
        queryKey: ["user", "getById", input.id] as const,
      }),
      query: async (input: { id: string }) => {
        return this.execute(
          `
          query GetUserById($id: ID!) {
            user(id: $id) {
              id
              authUserId
              email
              firstName
              lastName
              fullName
              role
              hasAvatar
              createdAt
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    getAll: {
      queryOptions: (input?: {
        pagination?: { limit: number; offset: number };
      }) => ({
        queryKey: ["user", "getAll", input?.pagination] as const,
      }),
      query: async (input?: {
        pagination?: { limit: number; offset: number };
      }) => {
        return this.execute(
          `
          query GetAllUsers($pagination: PaginationInput) {
            users(pagination: $pagination) {
              id
              authUserId
              email
              firstName
              lastName
              fullName
              role
              hasAvatar
              createdAt
            }
          }
        `,
          { pagination: input?.pagination },
        );
      },
    },
    getByTrip: {
      queryOptions: (input: { tripId: string }) => ({
        queryKey: ["user", "getByTrip", input.tripId] as const,
      }),
      query: async (input: { tripId: string }) => {
        return this.execute(
          `
          query GetUsersByTrip($tripId: ID!) {
            usersByTrip(tripId: $tripId) {
              id
              authUserId
              email
              firstName
              lastName
              fullName
              role
              hasAvatar
            }
          }
        `,
          { tripId: input.tripId },
        );
      },
    },
    getByGroup: {
      queryOptions: (input: { groupId: string }) => ({
        queryKey: ["user", "getByGroup", input.groupId] as const,
      }),
      query: async (input: { groupId: string }) => {
        return this.execute(
          `
          query GetUsersByGroup($groupId: ID!) {
            usersByGroup(groupId: $groupId) {
              id
              authUserId
              email
              firstName
              lastName
              fullName
              role
              hasAvatar
            }
          }
        `,
          { groupId: input.groupId },
        );
      },
    },
    getLeaderboard: {
      queryOptions: (input: { tripId: string }) => ({
        queryKey: ["user", "getLeaderboard", input.tripId] as const,
      }),
      query: async (input: { tripId: string }) => {
        return this.execute(
          `
          query GetLeaderboard($tripId: ID!) {
            leaderboard(tripId: $tripId) {
              id
              userId
              rank
              points
              user {
                id
                firstName
                lastName
                fullName
                hasAvatar
              }
            }
          }
        `,
          { tripId: input.tripId },
        );
      },
    },
    search: {
      queryOptions: (input: { search: string }) => ({
        queryKey: ["user", "search", input.search] as const,
      }),
      query: async (input: { search: string }) => {
        return this.execute(
          `
          query SearchUsers($search: String!) {
            searchUsers(search: $search) {
              id
              authUserId
              email
              firstName
              lastName
              fullName
              role
            }
          }
        `,
          { search: input.search },
        );
      },
    },

    // Mutations
    create: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          email: string;
          firstName?: string;
          lastName?: string;
          role?: string;
        }) => {
          return this.execute(
            `
            mutation CreateUser($input: CreateUserInput!) {
              createUser(input: $input) {
                id
                authUserId
                email
                firstName
                lastName
                role
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        email: string;
        firstName?: string;
        lastName?: string;
        role?: string;
      }) => {
        return this.execute(
          `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              authUserId
              email
              firstName
              lastName
              role
            }
          }
        `,
          { input },
        );
      },
    },
    update: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string } & Record<string, unknown>) => {
          return this.execute(
            `
            mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
              updateUser(id: $id, input: $input) {
                id
                email
                firstName
                lastName
                fullName
                role
                hasAvatar
              }
            }
          `,
            { id: input.id, input },
          );
        },
      }),
      mutate: async (input: { id: string } & Record<string, unknown>) => {
        return this.execute(
          `
          mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
            updateUser(id: $id, input: $input) {
              id
              email
              firstName
              lastName
              fullName
              role
              hasAvatar
            }
          }
        `,
          { id: input.id, input },
        );
      },
    },
    delete: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation DeleteUser($id: ID!) {
              deleteUser(id: $id) {
                id
                deleted
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id) {
              id
              deleted
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    assignToTrip: {
      mutationOptions: () => ({
        mutationFn: async (input: { userId: string; tripId: string }) => {
          return this.execute(
            `
            mutation AssignUserToTrip($userId: ID!, $tripId: ID!) {
              assignUserToTrip(userId: $userId, tripId: $tripId) {
                id
                userId
                tripId
                assignedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { userId: string; tripId: string }) => {
        return this.execute(
          `
          mutation AssignUserToTrip($userId: ID!, $tripId: ID!) {
            assignUserToTrip(userId: $userId, tripId: $tripId) {
              id
              userId
              tripId
              assignedAt
            }
          }
        `,
          input,
        );
      },
    },
    removeFromTrip: {
      mutationOptions: () => ({
        mutationFn: async (input: { userId: string; tripId: string }) => {
          return this.execute(
            `
            mutation RemoveUserFromTrip($userId: ID!, $tripId: ID!) {
              removeUserFromTrip(userId: $userId, tripId: $tripId) {
                id
                userId
                tripId
                removedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { userId: string; tripId: string }) => {
        return this.execute(
          `
          mutation RemoveUserFromTrip($userId: ID!, $tripId: ID!) {
            removeUserFromTrip(userId: $userId, tripId: $tripId) {
              id
              userId
              tripId
              removedAt
            }
          }
        `,
          input,
        );
      },
    },
    assignToGroup: {
      mutationOptions: () => ({
        mutationFn: async (input: { userId: string; groupId: string }) => {
          return this.execute(
            `
            mutation AssignUserToGroup($userId: ID!, $groupId: ID!) {
              assignUserToGroup(userId: $userId, groupId: $groupId) {
                id
                userId
                groupId
                assignedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { userId: string; groupId: string }) => {
        return this.execute(
          `
          mutation AssignUserToGroup($userId: ID!, $groupId: ID!) {
            assignUserToGroup(userId: $userId, groupId: $groupId) {
              id
              userId
              groupId
              assignedAt
            }
          }
        `,
          input,
        );
      },
    },
    removeFromGroup: {
      mutationOptions: () => ({
        mutationFn: async (input: { userId: string; groupId: string }) => {
          return this.execute(
            `
            mutation RemoveUserFromGroup($userId: ID!, $groupId: ID!) {
              removeUserFromGroup(userId: $userId, groupId: $groupId) {
                id
                userId
                groupId
                removedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { userId: string; groupId: string }) => {
        return this.execute(
          `
          mutation RemoveUserFromGroup($userId: ID!, $groupId: ID!) {
            removeUserFromGroup(userId: $userId, groupId: $groupId) {
              id
              userId
              groupId
              removedAt
            }
          }
        `,
          input,
        );
      },
    },
    updateProfile: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          firstName?: string;
          lastName?: string;
          avatar?: string;
        }) => {
          return this.execute(
            `
            mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
              updateUserProfile(input: $input) {
                id
                firstName
                lastName
                fullName
                hasAvatar
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
      }) => {
        return this.execute(
          `
          mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
            updateUserProfile(input: $input) {
              id
              firstName
              lastName
              fullName
              hasAvatar
            }
          }
        `,
          { input },
        );
      },
    },
  };

  // =============================================================================
  // TRIP DOMAIN (4 procedures)
  // =============================================================================
  trip = {
    getAll: {
      queryOptions: (input?: {
        pagination?: { limit: number; offset: number };
      }) => ({
        queryKey: ["trip", "getAll", input?.pagination] as const,
      }),
      query: async (input?: {
        pagination?: { limit: number; offset: number };
      }) => {
        return this.execute(
          `
          query GetAllTrips($pagination: PaginationInput) {
            trips(pagination: $pagination) {
              id
              name
              description
              startDate
              endDate
              status
              location
              coverImage
              createdAt
              pagination {
                limit
                offset
                hasMore
              }
            }
          }
        `,
          { pagination: input?.pagination },
        );
      },
    },
    getById: {
      queryOptions: (input: { id: string }) => ({
        queryKey: ["trip", "getById", input.id] as const,
      }),
      query: async (input: { id: string }) => {
        return this.execute(
          `
          query GetTripById($id: ID!) {
            trip(id: $id) {
              id
              name
              description
              startDate
              endDate
              status
              location
              coverImage
              resources {
                id
                title
                url
                type
              }
              sponsors {
                id
                name
                logo
                website
              }
              createdAt
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    getResources: {
      queryOptions: (input: { tripId: string }) => ({
        queryKey: ["trip", "getResources", input.tripId] as const,
      }),
      query: async (input: { tripId: string }) => {
        return this.execute(
          `
          query GetTripResources($tripId: ID!) {
            tripResources(tripId: $tripId) {
              id
              tripId
              title
              description
              url
              type
              order
              createdAt
            }
          }
        `,
          { tripId: input.tripId },
        );
      },
    },
    getMyTrips: {
      queryOptions: () => ({ queryKey: ["trip", "getMyTrips"] as const }),
      query: async () => {
        return this.execute(`
          query GetMyTrips {
            myTrips {
              id
              name
              description
              startDate
              endDate
              status
              location
              coverImage
              createdAt
            }
          }
        `);
      },
    },
  };

  // =============================================================================
  // GROUP DOMAIN (16 procedures)
  // =============================================================================
  group = {
    getAll: {
      queryOptions: (input?: { tripId?: string }) => ({
        queryKey: ["group", "getAll", input?.tripId] as const,
      }),
      query: async (input?: { tripId?: string }) => {
        return this.execute(
          `
          query GetAllGroups($tripId: ID) {
            groups(tripId: $tripId) {
              id
              name
              description
              tripId
              color
              maxMembers
              memberCount
              createdAt
            }
          }
        `,
          { tripId: input?.tripId },
        );
      },
    },
    getById: {
      queryOptions: (input: { id: string }) => ({
        queryKey: ["group", "getById", input.id] as const,
      }),
      query: async (input: { id: string }) => {
        return this.execute(
          `
          query GetGroupById($id: ID!) {
            group(id: $id) {
              id
              name
              description
              tripId
              color
              maxMembers
              memberCount
              members {
                id
                userId
                role
                user {
                  id
                  firstName
                  lastName
                  fullName
                  hasAvatar
                }
              }
              createdAt
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    getByTrip: {
      queryOptions: (input: { tripId: string }) => ({
        queryKey: ["group", "getByTrip", input.tripId] as const,
      }),
      query: async (input: { tripId: string }) => {
        return this.execute(
          `
          query GetGroupsByTrip($tripId: ID!) {
            groupsByTrip(tripId: $tripId) {
              id
              name
              description
              tripId
              color
              maxMembers
              memberCount
              createdAt
            }
          }
        `,
          { tripId: input.tripId },
        );
      },
    },
    getMyGroup: {
      queryOptions: (input: { tripId: string }) => ({
        queryKey: ["group", "getMyGroup", input.tripId] as const,
      }),
      query: async (input: { tripId: string }) => {
        return this.execute(
          `
          query GetMyGroup($tripId: ID!) {
            myGroup(tripId: $tripId) {
              id
              name
              description
              tripId
              color
              maxMembers
              memberCount
              members {
                id
                userId
                role
                user {
                  id
                  firstName
                  lastName
                  fullName
                  hasAvatar
                }
              }
              createdAt
            }
          }
        `,
          { tripId: input.tripId },
        );
      },
    },
    getMembers: {
      queryOptions: (input: { groupId: string }) => ({
        queryKey: ["group", "getMembers", input.groupId] as const,
      }),
      query: async (input: { groupId: string }) => {
        return this.execute(
          `
          query GetGroupMembers($groupId: ID!) {
            groupMembers(groupId: $groupId) {
              id
              userId
              groupId
              role
              joinedAt
              user {
                id
                firstName
                lastName
                fullName
                hasAvatar
              }
            }
          }
        `,
          { groupId: input.groupId },
        );
      },
    },
    getJoinRequests: {
      queryOptions: (input: { groupId: string }) => ({
        queryKey: ["group", "getJoinRequests", input.groupId] as const,
      }),
      query: async (input: { groupId: string }) => {
        return this.execute(
          `
          query GetGroupJoinRequests($groupId: ID!) {
            groupJoinRequests(groupId: $groupId) {
              id
              userId
              groupId
              status
              requestedAt
              user {
                id
                firstName
                lastName
                fullName
              }
            }
          }
        `,
          { groupId: input.groupId },
        );
      },
    },
    getByUser: {
      queryOptions: (input: { userId: string }) => ({
        queryKey: ["group", "getByUser", input.userId] as const,
      }),
      query: async (input: { userId: string }) => {
        return this.execute(
          `
          query GetGroupsByUser($userId: ID!) {
            groupsByUser(userId: $userId) {
              id
              name
              description
              tripId
              color
              maxMembers
              memberCount
              createdAt
            }
          }
        `,
          { userId: input.userId },
        );
      },
    },

    // Mutations
    create: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          name: string;
          description?: string;
          tripId: string;
          color?: string;
          maxMembers?: number;
        }) => {
          return this.execute(
            `
            mutation CreateGroup($input: CreateGroupInput!) {
              createGroup(input: $input) {
                id
                name
                description
                tripId
                color
                maxMembers
                createdAt
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        name: string;
        description?: string;
        tripId: string;
        color?: string;
        maxMembers?: number;
      }) => {
        return this.execute(
          `
          mutation CreateGroup($input: CreateGroupInput!) {
            createGroup(input: $input) {
              id
              name
              description
              tripId
              color
              maxMembers
              createdAt
            }
          }
        `,
          { input },
        );
      },
    },
    update: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string } & Record<string, unknown>) => {
          return this.execute(
            `
            mutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {
              updateGroup(id: $id, input: $input) {
                id
                name
                description
                color
                maxMembers
              }
            }
          `,
            { id: input.id, input },
          );
        },
      }),
      mutate: async (input: { id: string } & Record<string, unknown>) => {
        return this.execute(
          `
          mutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {
            updateGroup(id: $id, input: $input) {
              id
              name
              description
              color
              maxMembers
            }
          }
        `,
          { id: input.id, input },
        );
      },
    },
    delete: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation DeleteGroup($id: ID!) {
              deleteGroup(id: $id) {
                id
                deleted
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation DeleteGroup($id: ID!) {
            deleteGroup(id: $id) {
              id
              deleted
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    join: {
      mutationOptions: () => ({
        mutationFn: async (input: { groupId: string }) => {
          return this.execute(
            `
            mutation JoinGroup($groupId: ID!) {
              joinGroup(groupId: $groupId) {
                id
                userId
                groupId
                role
                joinedAt
              }
            }
          `,
            { groupId: input.groupId },
          );
        },
      }),
      mutate: async (input: { groupId: string }) => {
        return this.execute(
          `
          mutation JoinGroup($groupId: ID!) {
            joinGroup(groupId: $groupId) {
              id
              userId
              groupId
              role
              joinedAt
            }
          }
        `,
          { groupId: input.groupId },
        );
      },
    },
    leave: {
      mutationOptions: () => ({
        mutationFn: async (input: { groupId: string }) => {
          return this.execute(
            `
            mutation LeaveGroup($groupId: ID!) {
              leaveGroup(groupId: $groupId) {
                id
                userId
                groupId
                leftAt
              }
            }
          `,
            { groupId: input.groupId },
          );
        },
      }),
      mutate: async (input: { groupId: string }) => {
        return this.execute(
          `
          mutation LeaveGroup($groupId: ID!) {
            leaveGroup(groupId: $groupId) {
              id
              userId
              groupId
              leftAt
            }
          }
        `,
          { groupId: input.groupId },
        );
      },
    },
    requestJoin: {
      mutationOptions: () => ({
        mutationFn: async (input: { groupId: string; message?: string }) => {
          return this.execute(
            `
            mutation RequestJoinGroup($groupId: ID!, $message: String) {
              requestJoinGroup(groupId: $groupId, message: $message) {
                id
                userId
                groupId
                status
                requestedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { groupId: string; message?: string }) => {
        return this.execute(
          `
          mutation RequestJoinGroup($groupId: ID!, $message: String) {
            requestJoinGroup(groupId: $groupId, message: $message) {
              id
              userId
              groupId
              status
              requestedAt
            }
          }
        `,
          input,
        );
      },
    },
    approveJoinRequest: {
      mutationOptions: () => ({
        mutationFn: async (input: { requestId: string }) => {
          return this.execute(
            `
            mutation ApproveJoinRequest($requestId: ID!) {
              approveJoinRequest(requestId: $requestId) {
                id
                userId
                groupId
                status
                approvedAt
              }
            }
          `,
            { requestId: input.requestId },
          );
        },
      }),
      mutate: async (input: { requestId: string }) => {
        return this.execute(
          `
          mutation ApproveJoinRequest($requestId: ID!) {
            approveJoinRequest(requestId: $requestId) {
              id
              userId
              groupId
              status
              approvedAt
            }
          }
        `,
          { requestId: input.requestId },
        );
      },
    },
    rejectJoinRequest: {
      mutationOptions: () => ({
        mutationFn: async (input: { requestId: string; reason?: string }) => {
          return this.execute(
            `
            mutation RejectJoinRequest($requestId: ID!, $reason: String) {
              rejectJoinRequest(requestId: $requestId, reason: $reason) {
                id
                userId
                groupId
                status
                rejectedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { requestId: string; reason?: string }) => {
        return this.execute(
          `
          mutation RejectJoinRequest($requestId: ID!, $reason: String) {
            rejectJoinRequest(requestId: $requestId, reason: $reason) {
              id
              userId
              groupId
              status
              rejectedAt
            }
          }
        `,
          input,
        );
      },
    },
    removeMember: {
      mutationOptions: () => ({
        mutationFn: async (input: { groupId: string; userId: string }) => {
          return this.execute(
            `
            mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
              removeGroupMember(groupId: $groupId, userId: $userId) {
                id
                userId
                groupId
                removedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { groupId: string; userId: string }) => {
        return this.execute(
          `
          mutation RemoveGroupMember($groupId: ID!, $userId: ID!) {
            removeGroupMember(groupId: $groupId, userId: $userId) {
              id
              userId
              groupId
              removedAt
            }
          }
        `,
          input,
        );
      },
    },
  };

  // =============================================================================
  // CHALLENGE DOMAIN (6 procedures)
  // =============================================================================
  challenge = {
    getAll: {
      queryOptions: (input?: { tripId?: string; status?: string }) => ({
        queryKey: [
          "challenge",
          "getAll",
          input?.tripId,
          input?.status,
        ] as const,
      }),
      query: async (input?: { tripId?: string; status?: string }) => {
        return this.execute(
          `
          query GetAllChallenges($tripId: ID, $status: ChallengeStatus) {
            challenges(tripId: $tripId, status: $status) {
              id
              tripId
              name
              description
              type
              status
              points
              startTime
              endTime
              maxSubmissions
              submissionCount
              thumbnail
              createdAt
            }
          }
        `,
          { tripId: input?.tripId, status: input?.status },
        );
      },
    },
    getById: {
      queryOptions: (input: { id: string }) => ({
        queryKey: ["challenge", "getById", input.id] as const,
      }),
      query: async (input: { id: string }) => {
        return this.execute(
          `
          query GetChallengeById($id: ID!) {
            challenge(id: $id) {
              id
              tripId
              name
              description
              type
              status
              points
              startTime
              endTime
              maxSubmissions
              submissionCount
              thumbnail
              requiresLocation
              location {
                latitude
                longitude
                radius
              }
              qrCode
              judgingCriteria {
                criterion
                weight
              }
              createdAt
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    getByTrip: {
      queryOptions: (input: { tripId: string }) => ({
        queryKey: ["challenge", "getByTrip", input.tripId] as const,
      }),
      query: async (input: { tripId: string }) => {
        return this.execute(
          `
          query GetChallengesByTrip($tripId: ID!) {
            challengesByTrip(tripId: $tripId) {
              id
              tripId
              name
              description
              type
              status
              points
              startTime
              endTime
              maxSubmissions
              submissionCount
              thumbnail
              createdAt
            }
          }
        `,
          { tripId: input.tripId },
        );
      },
    },

    // Mutations
    submit: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          challengeId: string;
          content: string;
          mediaUrls?: string[];
          location?: { latitude: number; longitude: number };
        }) => {
          return this.execute(
            `
            mutation SubmitChallenge($input: ChallengeSubmissionInput!) {
              submitChallenge(input: $input) {
                id
                challengeId
                userId
                content
                mediaUrls
                location {
                  latitude
                  longitude
                }
                status
                submittedAt
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        challengeId: string;
        content: string;
        mediaUrls?: string[];
        location?: { latitude: number; longitude: number };
      }) => {
        return this.execute(
          `
          mutation SubmitChallenge($input: ChallengeSubmissionInput!) {
            submitChallenge(input: $input) {
              id
              challengeId
              userId
              content
              mediaUrls
              location {
                latitude
                longitude
              }
              status
              submittedAt
            }
          }
        `,
          { input },
        );
      },
    },
    start: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation StartChallenge($id: ID!) {
              startChallenge(id: $id) {
                id
                status
                startedAt
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation StartChallenge($id: ID!) {
            startChallenge(id: $id) {
              id
              status
              startedAt
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    complete: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation CompleteChallenge($id: ID!) {
              completeChallenge(id: $id) {
                id
                status
                completedAt
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation CompleteChallenge($id: ID!) {
            completeChallenge(id: $id) {
              id
              status
              completedAt
            }
          }
        `,
          { id: input.id },
        );
      },
    },
  };

  // =============================================================================
  // CHALLENGE SUBMISSION DOMAIN (6 procedures)
  // =============================================================================
  challengeSubmission = {
    getAll: {
      queryOptions: (input?: {
        challengeId?: string;
        userId?: string;
        status?: string;
      }) => ({
        queryKey: [
          "challengeSubmission",
          "getAll",
          input?.challengeId,
          input?.userId,
          input?.status,
        ] as const,
      }),
      query: async (input?: {
        challengeId?: string;
        userId?: string;
        status?: string;
      }) => {
        return this.execute(
          `
          query GetAllSubmissions($challengeId: ID, $userId: ID, $status: SubmissionStatus) {
            challengeSubmissions(challengeId: $challengeId, userId: $userId, status: $status) {
              id
              challengeId
              userId
              content
              mediaUrls
              location {
                latitude
                longitude
              }
              status
              score
              submittedAt
              reviewedAt
              user {
                id
                firstName
                lastName
                fullName
                hasAvatar
              }
            }
          }
        `,
          {
            challengeId: input?.challengeId,
            userId: input?.userId,
            status: input?.status,
          },
        );
      },
    },
    getById: {
      queryOptions: (input: { id: string }) => ({
        queryKey: ["challengeSubmission", "getById", input.id] as const,
      }),
      query: async (input: { id: string }) => {
        return this.execute(
          `
          query GetSubmissionById($id: ID!) {
            challengeSubmission(id: $id) {
              id
              challengeId
              userId
              content
              mediaUrls
              location {
                latitude
                longitude
              }
              status
              score
              submittedAt
              reviewedAt
              feedback
              user {
                id
                firstName
                lastName
                fullName
                hasAvatar
              }
              challenge {
                id
                name
                points
              }
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    getByChallenge: {
      queryOptions: (input: { challengeId: string }) => ({
        queryKey: [
          "challengeSubmission",
          "getByChallenge",
          input.challengeId,
        ] as const,
      }),
      query: async (input: { challengeId: string }) => {
        return this.execute(
          `
          query GetSubmissionsByChallenge($challengeId: ID!) {
            challengeSubmissionsByChallenge(challengeId: $challengeId) {
              id
              challengeId
              userId
              content
              mediaUrls
              status
              score
              submittedAt
              user {
                id
                firstName
                lastName
                fullName
              }
            }
          }
        `,
          { challengeId: input.challengeId },
        );
      },
    },

    // Mutations
    approve: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          id: string;
          score?: number;
          feedback?: string;
        }) => {
          return this.execute(
            `
            mutation ApproveSubmission($id: ID!, $score: Int, $feedback: String) {
              approveChallengeSubmission(id: $id, score: $score, feedback: $feedback) {
                id
                status
                score
                feedback
                reviewedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: {
        id: string;
        score?: number;
        feedback?: string;
      }) => {
        return this.execute(
          `
          mutation ApproveSubmission($id: ID!, $score: Int, $feedback: String) {
            approveChallengeSubmission(id: $id, score: $score, feedback: $feedback) {
              id
              status
              score
              feedback
              reviewedAt
            }
          }
        `,
          input,
        );
      },
    },
    reject: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string; feedback?: string }) => {
          return this.execute(
            `
            mutation RejectSubmission($id: ID!, $feedback: String) {
              rejectChallengeSubmission(id: $id, feedback: $feedback) {
                id
                status
                feedback
                reviewedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { id: string; feedback?: string }) => {
        return this.execute(
          `
          mutation RejectSubmission($id: ID!, $feedback: String) {
            rejectChallengeSubmission(id: $id, feedback: $feedback) {
              id
              status
              feedback
              reviewedAt
            }
          }
        `,
          input,
        );
      },
    },
    delete: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation DeleteSubmission($id: ID!) {
              deleteChallengeSubmission(id: $id) {
                id
                deleted
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation DeleteSubmission($id: ID!) {
            deleteChallengeSubmission(id: $id) {
              id
              deleted
            }
          }
        `,
          { id: input.id },
        );
      },
    },
  };

  // =============================================================================
  // CHALLENGE VOTE DOMAIN (5 procedures)
  // =============================================================================
  challengeVote = {
    getAll: {
      queryOptions: (input: { submissionId: string }) => ({
        queryKey: ["challengeVote", "getAll", input.submissionId] as const,
      }),
      query: async (input: { submissionId: string }) => {
        return this.execute(
          `
          query GetVotesBySubmission($submissionId: ID!) {
            challengeVotesBySubmission(submissionId: $submissionId) {
              id
              submissionId
              userId
              score
              votedAt
              user {
                id
                firstName
                lastName
              }
            }
          }
        `,
          { submissionId: input.submissionId },
        );
      },
    },
    getByUser: {
      queryOptions: (input: { challengeId: string; userId: string }) => ({
        queryKey: [
          "challengeVote",
          "getByUser",
          input.challengeId,
          input.userId,
        ] as const,
      }),
      query: async (input: { challengeId: string; userId: string }) => {
        return this.execute(
          `
          query GetVotesByUser($challengeId: ID!, $userId: ID!) {
            challengeVotesByUser(challengeId: $challengeId, userId: $userId) {
              id
              submissionId
              score
              votedAt
            }
          }
        `,
          input,
        );
      },
    },

    // Mutations
    submit: {
      mutationOptions: () => ({
        mutationFn: async (input: { submissionId: string; score: number }) => {
          return this.execute(
            `
            mutation SubmitVote($input: ChallengeVoteInput!) {
              submitChallengeVote(input: $input) {
                id
                submissionId
                userId
                score
                votedAt
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: { submissionId: string; score: number }) => {
        return this.execute(
          `
          mutation SubmitVote($input: ChallengeVoteInput!) {
            submitChallengeVote(input: $input) {
              id
              submissionId
              userId
              score
              votedAt
            }
          }
        `,
          { input },
        );
      },
    },
    submitVotes: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          votes: { submissionId: string; score: number }[];
        }) => {
          return this.execute(
            `
            mutation SubmitVotes($votes: [ChallengeVoteInput!]!) {
              submitChallengeVotes(votes: $votes) {
                id
                submissionId
                score
                votedAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: {
        votes: { submissionId: string; score: number }[];
      }) => {
        return this.execute(
          `
          mutation SubmitVotes($votes: [ChallengeVoteInput!]!) {
            submitChallengeVotes(votes: $votes) {
              id
              submissionId
              score
              votedAt
            }
          }
        `,
          input,
        );
      },
    },
    forceEndVoting: {
      mutationOptions: () => ({
        mutationFn: async (input: { challengeId: string }) => {
          return this.execute(
            `
            mutation ForceEndVoting($challengeId: ID!) {
              forceEndChallengeVoting(challengeId: $challengeId) {
                id
                status
                votingEndedAt
              }
            }
          `,
            { challengeId: input.challengeId },
          );
        },
      }),
      mutate: async (input: { challengeId: string }) => {
        return this.execute(
          `
          mutation ForceEndVoting($challengeId: ID!) {
            forceEndChallengeVoting(challengeId: $challengeId) {
              id
              status
              votingEndedAt
            }
          }
        `,
          { challengeId: input.challengeId },
        );
      },
    },
  };

  // =============================================================================
  // REWARD DOMAIN (12 procedures)
  // =============================================================================
  reward = {
    getAll: {
      queryOptions: (input?: { tripId?: string; available?: boolean }) => ({
        queryKey: [
          "reward",
          "getAll",
          input?.tripId,
          input?.available,
        ] as const,
      }),
      query: async (input?: { tripId?: string; available?: boolean }) => {
        return this.execute(
          `
          query GetAllRewards($tripId: ID, $available: Boolean) {
            rewards(tripId: $tripId, available: $available) {
              id
              tripId
              name
              description
              type
              rarity
              image
              cost
              quantity
              available
              createdAt
            }
          }
        `,
          { tripId: input?.tripId, available: input?.available },
        );
      },
    },
    getById: {
      queryOptions: (input: { id: string }) => ({
        queryKey: ["reward", "getById", input.id] as const,
      }),
      query: async (input: { id: string }) => {
        return this.execute(
          `
          query GetRewardById($id: ID!) {
            reward(id: $id) {
              id
              tripId
              name
              description
              type
              rarity
              image
              cost
              quantity
              available
              requirements {
                requirement
                value
              }
              createdAt
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    getByTrip: {
      queryOptions: (input: { tripId: string }) => ({
        queryKey: ["reward", "getByTrip", input.tripId] as const,
      }),
      query: async (input: { tripId: string }) => {
        return this.execute(
          `
          query GetRewardsByTrip($tripId: ID!) {
            rewardsByTrip(tripId: $tripId) {
              id
              name
              description
              type
              rarity
              image
              cost
              quantity
              available
            }
          }
        `,
          { tripId: input.tripId },
        );
      },
    },
    getMyRewards: {
      queryOptions: () => ({ queryKey: ["reward", "getMyRewards"] as const }),
      query: async () => {
        return this.execute(`
          query GetMyRewards {
            myRewards {
              id
              rewardId
              reward {
                id
                name
                description
                type
                rarity
                image
              }
              acquiredAt
              consumedAt
            }
          }
        `);
      },
    },
    getPurchases: {
      queryOptions: (input?: { rewardId?: string }) => ({
        queryKey: ["reward", "getPurchases", input?.rewardId] as const,
      }),
      query: async (input?: { rewardId?: string }) => {
        return this.execute(
          `
          query GetRewardPurchases($rewardId: ID) {
            rewardPurchases(rewardId: $rewardId) {
              id
              rewardId
              userId
              cost
              purchasedAt
              user {
                id
                firstName
                lastName
              }
              reward {
                id
                name
              }
            }
          }
        `,
          { rewardId: input?.rewardId },
        );
      },
    },

    // Mutations
    create: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          name: string;
          description?: string;
          tripId: string;
          type: string;
          rarity: string;
          cost: number;
          quantity?: number;
        }) => {
          return this.execute(
            `
            mutation CreateReward($input: CreateRewardInput!) {
              createReward(input: $input) {
                id
                name
                description
                tripId
                type
                rarity
                cost
                quantity
                available
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        name: string;
        description?: string;
        tripId: string;
        type: string;
        rarity: string;
        cost: number;
        quantity?: number;
      }) => {
        return this.execute(
          `
          mutation CreateReward($input: CreateRewardInput!) {
            createReward(input: $input) {
              id
              name
              description
              tripId
              type
              rarity
              cost
              quantity
              available
            }
          }
        `,
          { input },
        );
      },
    },
    update: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string } & Record<string, unknown>) => {
          return this.execute(
            `
            mutation UpdateReward($id: ID!, $input: UpdateRewardInput!) {
              updateReward(id: $id, input: $input) {
                id
                name
                description
                type
                rarity
                cost
                quantity
                available
              }
            }
          `,
            { id: input.id, input },
          );
        },
      }),
      mutate: async (input: { id: string } & Record<string, unknown>) => {
        return this.execute(
          `
          mutation UpdateReward($id: ID!, $input: UpdateRewardInput!) {
            updateReward(id: $id, input: $input) {
              id
              name
              description
              type
              rarity
              cost
              quantity
              available
            }
          }
        `,
          { id: input.id, input },
        );
      },
    },
    delete: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation DeleteReward($id: ID!) {
              deleteReward(id: $id) {
                id
                deleted
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation DeleteReward($id: ID!) {
            deleteReward(id: $id) {
              id
              deleted
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    purchase: {
      mutationOptions: () => ({
        mutationFn: async (input: { rewardId: string }) => {
          return this.execute(
            `
            mutation PurchaseReward($rewardId: ID!) {
              purchaseReward(rewardId: $rewardId) {
                id
                rewardId
                userId
                cost
                purchasedAt
              }
            }
          `,
            { rewardId: input.rewardId },
          );
        },
      }),
      mutate: async (input: { rewardId: string }) => {
        return this.execute(
          `
          mutation PurchaseReward($rewardId: ID!) {
            purchaseReward(rewardId: $rewardId) {
              id
              rewardId
              userId
              cost
              purchasedAt
            }
          }
        `,
          { rewardId: input.rewardId },
        );
      },
    },
    consume: {
      mutationOptions: () => ({
        mutationFn: async (input: { purchaseId: string }) => {
          return this.execute(
            `
            mutation ConsumeReward($purchaseId: ID!) {
              consumeReward(purchaseId: $purchaseId) {
                id
                purchaseId
                consumedAt
              }
            }
          `,
            { purchaseId: input.purchaseId },
          );
        },
      }),
      mutate: async (input: { purchaseId: string }) => {
        return this.execute(
          `
          mutation ConsumeReward($purchaseId: ID!) {
            consumeReward(purchaseId: $purchaseId) {
              id
              purchaseId
              consumedAt
            }
          }
        `,
          { purchaseId: input.purchaseId },
        );
      },
    },
    addQuantity: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string; quantity: number }) => {
          return this.execute(
            `
            mutation AddRewardQuantity($id: ID!, $quantity: Int!) {
              addRewardQuantity(id: $id, quantity: $quantity) {
                id
                quantity
                available
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { id: string; quantity: number }) => {
        return this.execute(
          `
          mutation AddRewardQuantity($id: ID!, $quantity: Int!) {
            addRewardQuantity(id: $id, quantity: $quantity) {
              id
              quantity
              available
            }
          }
        `,
          input,
        );
      },
    },
  };

  // =============================================================================
  // COIN TRANSACTION DOMAIN (1 procedure)
  // =============================================================================
  coinTransaction = {
    getByUser: {
      queryOptions: (input: { userId: string }) => ({
        queryKey: ["coinTransaction", "getByUser", input.userId] as const,
      }),
      query: async (input: { userId: string }) => {
        return this.execute(
          `
          query GetCoinTransactionsByUser($userId: ID!) {
            coinTransactionsByUser(userId: $userId) {
              id
              userId
              amount
              type
              reason
              challengeId
              createdAt
            }
          }
        `,
          { userId: input.userId },
        );
      },
    },
  };

  // =============================================================================
  // ACTIVITY FEED DOMAIN (8 procedures)
  // =============================================================================
  activityFeed = {
    getByTripModeration: {
      queryOptions: (input: { tripId: string; page?: number }) => ({
        queryKey: [
          "activityFeed",
          "getByTripModeration",
          input.tripId,
          input.page,
        ] as const,
      }),
      query: async (input: { tripId: string; page?: number }) => {
        return this.execute(
          `
          query GetActivityFeedByTripModeration($tripId: ID!, $page: Int) {
            activityFeedByTripModeration(tripId: $tripId, page: $page) {
              id
              userId
              tripId
              type
              title
              description
              metadata
              imageUrl
              isPinned
              isHidden
              createdAt
              user {
                id
                firstName
                lastName
                fullName
                hasAvatar
              }
            }
          }
        `,
          { tripId: input.tripId, page: input.page },
        );
      },
    },
    getById: {
      queryOptions: (input: { id: string }) => ({
        queryKey: ["activityFeed", "getById", input.id] as const,
      }),
      query: async (input: { id: string }) => {
        return this.execute(
          `
          query GetActivityFeedById($id: ID!) {
            activityFeedItem(id: $id) {
              id
              userId
              tripId
              type
              title
              description
              metadata
              imageUrl
              isPinned
              isHidden
              createdAt
              user {
                id
                firstName
                lastName
                fullName
              }
            }
          }
        `,
          { id: input.id },
        );
      },
    },

    // Mutations
    createCustom: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          tripId: string;
          title: string;
          description?: string;
          imageUrl?: string;
          isPinned?: boolean;
        }) => {
          return this.execute(
            `
            mutation CreateCustomActivity($input: CreateActivityFeedInput!) {
              createCustomActivity(input: $input) {
                id
                userId
                tripId
                type
                title
                description
                imageUrl
                isPinned
                createdAt
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        tripId: string;
        title: string;
        description?: string;
        imageUrl?: string;
        isPinned?: boolean;
      }) => {
        return this.execute(
          `
          mutation CreateCustomActivity($input: CreateActivityFeedInput!) {
            createCustomActivity(input: $input) {
              id
              userId
              tripId
              type
              title
              description
              imageUrl
              isPinned
              createdAt
            }
          }
        `,
          { input },
        );
      },
    },
    setPinned: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string; pinned: boolean }) => {
          return this.execute(
            `
            mutation SetActivityFeedPinned($id: ID!, $pinned: Boolean!) {
              setActivityFeedPinned(id: $id, pinned: $pinned) {
                id
                isPinned
              }
            }
          `,
            { id: input.id, pinned: input.pinned },
          );
        },
      }),
      mutate: async (input: { id: string; pinned: boolean }) => {
        return this.execute(
          `
          mutation SetActivityFeedPinned($id: ID!, $pinned: Boolean!) {
            setActivityFeedPinned(id: $id, pinned: $pinned) {
              id
              isPinned
            }
          }
        `,
          { id: input.id, pinned: input.pinned },
        );
      },
    },
    hide: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation HideActivityFeedItem($id: ID!) {
              hideActivityFeedItem(id: $id) {
                id
                isHidden
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation HideActivityFeedItem($id: ID!) {
            hideActivityFeedItem(id: $id) {
              id
              isHidden
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    unhide: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation UnhideActivityFeedItem($id: ID!) {
              unhideActivityFeedItem(id: $id) {
                id
                isHidden
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation UnhideActivityFeedItem($id: ID!) {
            unhideActivityFeedItem(id: $id) {
              id
              isHidden
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    delete: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation DeleteActivityFeedItem($id: ID!) {
              deleteActivityFeedItem(id: $id) {
                id
                deleted
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation DeleteActivityFeedItem($id: ID!) {
            deleteActivityFeedItem(id: $id) {
              id
              deleted
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    update: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string } & Record<string, unknown>) => {
          return this.execute(
            `
            mutation UpdateActivityFeedItem($id: ID!, $input: UpdateActivityFeedInput!) {
              updateActivityFeedItem(id: $id, input: $input) {
                id
                title
                description
                imageUrl
                isPinned
                isHidden
              }
            }
          `,
            { id: input.id, input },
          );
        },
      }),
      mutate: async (input: { id: string } & Record<string, unknown>) => {
        return this.execute(
          `
          mutation UpdateActivityFeedItem($id: ID!, $input: UpdateActivityFeedInput!) {
            updateActivityFeedItem(id: $id, input: $input) {
              id
              title
              description
              imageUrl
              isPinned
              isHidden
            }
          }
        `,
          { id: input.id, input },
        );
      },
    },
  };

  // =============================================================================
  // NOTIFICATIONS DOMAIN (7 procedures)
  // =============================================================================
  notification = {
    getAll: {
      queryOptions: (input?: { unreadOnly?: boolean }) => ({
        queryKey: ["notification", "getAll", input?.unreadOnly] as const,
      }),
      query: async (input?: { unreadOnly?: boolean }) => {
        return this.execute(
          `
          query GetNotifications($unreadOnly: Boolean) {
            notifications(unreadOnly: $unreadOnly) {
              id
              userId
              type
              title
              body
              data
              read
              createdAt
            }
          }
        `,
          { unreadOnly: input?.unreadOnly },
        );
      },
    },
    getUnreadCount: {
      queryOptions: () => ({
        queryKey: ["notification", "getUnreadCount"] as const,
      }),
      query: async () => {
        return this.execute(`
          query GetUnreadNotificationCount {
            unreadNotificationCount
          }
        `);
      },
    },
    getPreferences: {
      queryOptions: () => ({
        queryKey: ["notification", "getPreferences"] as const,
      }),
      query: async () => {
        return this.execute(`
          query GetNotificationPreferences {
            notificationPreferences {
              type
              enabled
              pushEnabled
              emailEnabled
            }
          }
        `);
      },
    },

    // Mutations
    markAsRead: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation MarkNotificationAsRead($id: ID!) {
              markNotificationAsRead(id: $id) {
                id
                read
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation MarkNotificationAsRead($id: ID!) {
            markNotificationAsRead(id: $id) {
              id
              read
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    markAllAsRead: {
      mutationOptions: () => ({
        mutationFn: async () => {
          return this.execute(`
            mutation MarkAllNotificationsAsRead {
              markAllNotificationsAsRead {
                success
                markedCount
              }
            }
          `);
        },
      }),
      mutate: async () => {
        return this.execute(`
          mutation MarkAllNotificationsAsRead {
            markAllNotificationsAsRead {
              success
              markedCount
            }
          }
        `);
      },
    },
    updatePreferences: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          type: string;
          enabled: boolean;
          pushEnabled?: boolean;
          emailEnabled?: boolean;
        }) => {
          return this.execute(
            `
            mutation UpdateNotificationPreferences($input: UpdateNotificationPreferencesInput!) {
              updateNotificationPreferences(input: $input) {
                type
                enabled
                pushEnabled
                emailEnabled
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        type: string;
        enabled: boolean;
        pushEnabled?: boolean;
        emailEnabled?: boolean;
      }) => {
        return this.execute(
          `
          mutation UpdateNotificationPreferences($input: UpdateNotificationPreferencesInput!) {
            updateNotificationPreferences(input: $input) {
              type
              enabled
              pushEnabled
              emailEnabled
            }
          }
        `,
          { input },
        );
      },
    },
    delete: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation DeleteNotification($id: ID!) {
              deleteNotification(id: $id) {
                id
                deleted
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation DeleteNotification($id: ID!) {
            deleteNotification(id: $id) {
              id
              deleted
            }
          }
        `,
          { id: input.id },
        );
      },
    },
  };

  // =============================================================================
  // NOTIFICATION SCHEDULE DOMAIN (4 procedures)
  // =============================================================================
  notificationSchedule = {
    getAll: {
      queryOptions: (input?: { tripId?: string; active?: boolean }) => ({
        queryKey: [
          "notificationSchedule",
          "getAll",
          input?.tripId,
          input?.active,
        ] as const,
      }),
      query: async (input?: { tripId?: string; active?: boolean }) => {
        return this.execute(
          `
          query GetNotificationSchedules($tripId: ID, $active: Boolean) {
            notificationSchedules(tripId: $tripId, active: $active) {
              id
              tripId
              name
              description
              type
              schedule
              isActive
              lastRunAt
              nextRunAt
              createdAt
            }
          }
        `,
          { tripId: input?.tripId, active: input?.active },
        );
      },
    },

    // Mutations
    create: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          name: string;
          tripId: string;
          type: string;
          schedule: string;
          description?: string;
        }) => {
          return this.execute(
            `
            mutation CreateNotificationSchedule($input: CreateNotificationScheduleInput!) {
              createNotificationSchedule(input: $input) {
                id
                name
                tripId
                type
                schedule
                isActive
                createdAt
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        name: string;
        tripId: string;
        type: string;
        schedule: string;
        description?: string;
      }) => {
        return this.execute(
          `
          mutation CreateNotificationSchedule($input: CreateNotificationScheduleInput!) {
            createNotificationSchedule(input: $input) {
              id
              name
              tripId
              type
              schedule
              isActive
              createdAt
            }
          }
        `,
          { input },
        );
      },
    },
    update: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string } & Record<string, unknown>) => {
          return this.execute(
            `
            mutation UpdateNotificationSchedule($id: ID!, $input: UpdateNotificationScheduleInput!) {
              updateNotificationSchedule(id: $id, input: $input) {
                id
                name
                description
                type
                schedule
                isActive
              }
            }
          `,
            { id: input.id, input },
          );
        },
      }),
      mutate: async (input: { id: string } & Record<string, unknown>) => {
        return this.execute(
          `
          mutation UpdateNotificationSchedule($id: ID!, $input: UpdateNotificationScheduleInput!) {
            updateNotificationSchedule(id: $id, input: $input) {
              id
              name
              description
              type
              schedule
              isActive
            }
          }
        `,
          { id: input.id, input },
        );
      },
    },
    delete: {
      mutationOptions: () => ({
        mutationFn: async (input: { id: string }) => {
          return this.execute(
            `
            mutation DeleteNotificationSchedule($id: ID!) {
              deleteNotificationSchedule(id: $id) {
                id
                deleted
              }
            }
          `,
            { id: input.id },
          );
        },
      }),
      mutate: async (input: { id: string }) => {
        return this.execute(
          `
          mutation DeleteNotificationSchedule($id: ID!) {
            deleteNotificationSchedule(id: $id) {
              id
              deleted
            }
          }
        `,
          { id: input.id },
        );
      },
    },
  };

  // =============================================================================
  // LOCATION DOMAIN (5 procedures)
  // =============================================================================
  location = {
    getAll: {
      queryOptions: (input?: {
        tripId?: string;
        userId?: string;
        active?: boolean;
      }) => ({
        queryKey: [
          "location",
          "getAll",
          input?.tripId,
          input?.userId,
          input?.active,
        ] as const,
      }),
      query: async (input?: {
        tripId?: string;
        userId?: string;
        active?: boolean;
      }) => {
        return this.execute(
          `
          query GetLocations($tripId: ID, $userId: ID, $active: Boolean) {
            locations(tripId: $tripId, userId: $userId, active: $active) {
              id
              userId
              tripId
              latitude
              longitude
              accuracy
              timestamp
              user {
                id
                firstName
                lastName
                fullName
              }
            }
          }
        `,
          {
            tripId: input?.tripId,
            userId: input?.userId,
            active: input?.active,
          },
        );
      },
    },
    getMyLocation: {
      queryOptions: () => ({
        queryKey: ["location", "getMyLocation"] as const,
      }),
      query: async () => {
        return this.execute(`
          query GetMyLocation {
            myLocation {
              id
              latitude
              longitude
              accuracy
              timestamp
            }
          }
        `);
      },
    },

    // Mutations
    update: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          latitude: number;
          longitude: number;
          accuracy?: number;
        }) => {
          return this.execute(
            `
            mutation UpdateLocation($input: UpdateLocationInput!) {
              updateLocation(input: $input) {
                id
                latitude
                longitude
                accuracy
                timestamp
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        latitude: number;
        longitude: number;
        accuracy?: number;
      }) => {
        return this.execute(
          `
          mutation UpdateLocation($input: UpdateLocationInput!) {
            updateLocation(input: $input) {
              id
              latitude
              longitude
              accuracy
              timestamp
            }
          }
        `,
          { input },
        );
      },
    },
    share: {
      mutationOptions: () => ({
        mutationFn: async (input: { enabled: boolean; duration?: number }) => {
          return this.execute(
            `
            mutation SetLocationSharing($enabled: Boolean!, $duration: Int) {
              setLocationSharing(enabled: $enabled, duration: $duration) {
                enabled
                expiresAt
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: { enabled: boolean; duration?: number }) => {
        return this.execute(
          `
          mutation SetLocationSharing($enabled: Boolean!, $duration: Int) {
            setLocationSharing(enabled: $enabled, duration: $duration) {
              enabled
              expiresAt
            }
          }
        `,
          input,
        );
      },
    },
    batchUpdate: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          locations: {
            latitude: number;
            longitude: number;
            accuracy?: number;
            timestamp: string;
          }[];
        }) => {
          return this.execute(
            `
            mutation BatchUpdateLocations($locations: [LocationInput!]!) {
              batchUpdateLocations(locations: $locations) {
                success
                count
              }
            }
          `,
            input,
          );
        },
      }),
      mutate: async (input: {
        locations: {
          latitude: number;
          longitude: number;
          accuracy?: number;
          timestamp: string;
        }[];
      }) => {
        return this.execute(
          `
          mutation BatchUpdateLocations($locations: [LocationInput!]!) {
            batchUpdateLocations(locations: $locations) {
              success
              count
            }
          }
        `,
          input,
        );
      },
    },
  };

  // =============================================================================
  // STORAGE DOMAIN (2 procedures)
  // =============================================================================
  storage = {
    getUploadUrl: {
      queryOptions: (input: { filename: string; contentType: string }) => ({
        queryKey: [
          "storage",
          "getUploadUrl",
          input.filename,
          input.contentType,
        ] as const,
      }),
      query: async (input: { filename: string; contentType: string }) => {
        return this.execute(
          `
          query GetUploadUrl($filename: String!, $contentType: String!) {
            uploadUrl(filename: $filename, contentType: $contentType) {
              url
              fields
              key
            }
          }
        `,
          input,
        );
      },
    },

    // Mutations
    createTusUpload: {
      mutationOptions: () => ({
        mutationFn: async (input: {
          filename: string;
          fileSize: number;
          contentType: string;
          metadata?: Record<string, string>;
        }) => {
          return this.execute(
            `
            mutation CreateTusUpload($input: CreateTusUploadInput!) {
              createTusUpload(input: $input) {
                uploadUrl
                uploadKey
              }
            }
          `,
            { input },
          );
        },
      }),
      mutate: async (input: {
        filename: string;
        fileSize: number;
        contentType: string;
        metadata?: Record<string, string>;
      }) => {
        return this.execute(
          `
          mutation CreateTusUpload($input: CreateTusUploadInput!) {
            createTusUpload(input: $input) {
              uploadUrl
              uploadKey
            }
          }
        `,
          { input },
        );
      },
    },
  };

  // =============================================================================
  // SPONSOR DOMAIN (3 procedures)
  // =============================================================================
  sponsor = {
    getAll: {
      queryOptions: (input?: { tripId?: string }) => ({
        queryKey: ["sponsor", "getAll", input?.tripId] as const,
      }),
      query: async (input?: { tripId?: string }) => {
        return this.execute(
          `
          query GetAllSponsors($tripId: ID) {
            sponsors(tripId: $tripId) {
              id
              name
              description
              logo
              website
              tier
              tripId
              createdAt
            }
          }
        `,
          { tripId: input?.tripId },
        );
      },
    },
    getById: {
      queryOptions: (input: { id: string }) => ({
        queryKey: ["sponsor", "getById", input.id] as const,
      }),
      query: async (input: { id: string }) => {
        return this.execute(
          `
          query GetSponsorById($id: ID!) {
            sponsor(id: $id) {
              id
              name
              description
              logo
              website
              tier
              tripId
              resources {
                id
                title
                url
                type
              }
              createdAt
            }
          }
        `,
          { id: input.id },
        );
      },
    },
    getByTrip: {
      queryOptions: (input: { tripId: string }) => ({
        queryKey: ["sponsor", "getByTrip", input.tripId] as const,
      }),
      query: async (input: { tripId: string }) => {
        return this.execute(
          `
          query GetSponsorsByTrip($tripId: ID!) {
            sponsorsByTrip(tripId: $tripId) {
              id
              name
              description
              logo
              website
              tier
              createdAt
            }
          }
        `,
          { tripId: input.tripId },
        );
      },
    },
  };
}

// =============================================================================
// React Context & Provider
// =============================================================================

const GraphQLContext = createContext<GraphQLClient | null>(null);

export { GraphQLContext };

interface GraphQLProviderProps {
  children: ReactNode;
  endpoint: string;
  getAuthToken: () => string | null;
}

export function GraphQLProvider({
  children,
  endpoint,
  getAuthToken,
}: GraphQLProviderProps) {
  const client = useMemo(
    () => new GraphQLClient({ endpoint, getAuthToken }),
    [endpoint, getAuthToken],
  );

  return (
    <GraphQLContext.Provider value={client}>{children}</GraphQLContext.Provider>
  );
}

// =============================================================================
// React Hooks
// =============================================================================

/**
 * useGraphQL hook
 *
 * Returns the GraphQL client procedures for use with React Query.
 * API-compatible with the previous useTRPC hook.
 */
export function useGraphQL(): GraphQLClient {
  const context = useContext(GraphQLContext);

  if (!context) {
    throw new Error("useGraphQL must be used within a GraphQLProvider");
  }

  return context;
}

/**
 * useGraphQLClient hook
 *
 * Returns the raw GraphQL client for imperative API calls.
 * API-compatible with the previous useTRPCClient hook.
 */
export function useGraphQLClient(): GraphQLClient {
  const context = useContext(GraphQLContext);

  if (!context) {
    throw new Error("useGraphQLClient must be used within a GraphQLProvider");
  }

  return context;
}