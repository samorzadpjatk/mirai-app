"use client";

import { useState } from "react";
import { GraphQLClient } from "graphql-request";
import {
  useGetUserQuery,
  useGetTripsQuery,
  useGetCurrentUserQuery,
  type GetUserQuery,
  type GetTripsQuery,
} from "@mirai-app/graphql-types";
import { env } from "../lib/env";

/**
 * GraphQL Example Component
 *
 * Demonstrates how to use the generated GraphQL hooks from @mirai-app/graphql-types
 * with TanStack Query. This component shows loading, error, and success states.
 *
 * Key patterns demonstrated:
 * 1. Creating a GraphQL client instance
 * 2. Using useGetUserQuery with variables
 * 3. Using useGetTripsQuery with optional variables and query options
 * 4. Handling loading and error states
 * 5. Accessing typed response data
 */

// =============================================================================
// GraphQL Client Setup
// =============================================================================

/**
 * Create a GraphQL client instance
 *
 * The generated hooks require a GraphQLClient instance as their first parameter.
 * This client should be configured with your GraphQL endpoint and any
 * necessary authentication headers.
 */
const createGraphQLClient = () => {
  // Get auth token from cookies or your auth store
  const getAuthToken = () => {
    // Example: Get token from document.cookie or localStorage
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) =>
      c.trim().startsWith("sb-access-token="),
    );
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  return new GraphQLClient(env.graphqlUrl, {
    headers: () => {
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
};

// =============================================================================
// Example Components
// =============================================================================

/**
 * Example 1: Fetching a User by ID
 *
 * Demonstrates useGetUserQuery with required variables
 */
function UserExample() {
  // Create the GraphQL client (in real apps, this might come from context)
  const [client] = useState(createGraphQLClient);

  // State for user ID input
  const [userId, setUserId] = useState("user-123");

  // Use the generated hook with variables
  // The first parameter is the GraphQL client
  // The second parameter is the query variables
  // The third parameter is optional TanStack Query options
  const { data, isLoading, error, refetch } = useGetUserQuery(
    client,
    { id: userId },
    {
      // Optional: Override staleTime for this specific query
      staleTime: 60000, // 1 minute
      // Optional: Enable/disable query based on condition
      enabled: userId.length > 0,
    },
  );

  if (isLoading) {
    return (
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-blue-600">Loading user...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-600">Error loading user: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-gray-600">No user found with ID: {userId}</p>
      </div>
    );
  }

  // Data is fully typed based on your GraphQL schema
  const user: GetUserQuery["user"] = data.user;

  return (
    <div className="rounded-lg bg-green-50 p-4">
      <h3 className="mb-2 text-lg font-semibold text-green-800">
        User Found: {user.fullName}
      </h3>
      <div className="space-y-1 text-sm text-green-700">
        <p>ID: {user.id}</p>
        <p>First Name: {user.firstName}</p>
        <p>Last Name: {user.lastName}</p>
        <p>Role: {user.role}</p>
        <p>Has Avatar: {user.hasAvatar ? "Yes" : "No"}</p>
        <p>Is Admin: {user.isAdmin ? "Yes" : "No"}</p>
        <p>Is Moderator: {user.isModerator ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}

/**
 * Example 2: Fetching All Trips
 *
 * Demonstrates useGetTripsQuery with optional variables and pagination
 */
function TripsExample() {
  const [client] = useState(createGraphQLClient);

  // Optional: Add pagination state
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
  });

  // Use the generated hook
  // Variables are optional for GetTrips, so we can pass undefined or an object
  const { data, isLoading, error, isFetching } = useGetTripsQuery(
    client,
    { pagination },
    {
      // Keep previous data while fetching new page
      placeholderData: (previousData) => previousData,
      // Different stale time for trips list
      staleTime: 10000, // 10 seconds
    },
  );

  if (isLoading) {
    return (
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-blue-600">Loading trips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-600">Error loading trips: {error.message}</p>
      </div>
    );
  }

  const tripsData: GetTripsQuery["trips"] | undefined = data?.trips;
  const trips = tripsData?.trips ?? [];
  const paginationInfo = tripsData?.pagination;

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h3 className="mb-4 text-lg font-semibold">
        Trips ({paginationInfo?.total ?? 0} total)
      </h3>

      {isFetching && (
        <p className="mb-2 text-sm text-blue-600">Refreshing...</p>
      )}

      <div className="space-y-2">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="rounded border border-gray-200 p-3 hover:bg-gray-50"
          >
            <h4 className="font-medium">{trip.name}</h4>
            <p className="text-sm text-gray-600">{trip.description}</p>
            <div className="mt-1 text-xs text-gray-500">
              <span
                className={`inline-block rounded px-2 py-1 ${
                  trip.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {trip.status}
              </span>
              <span className="ml-2">
                {new Date(trip.startDate).toLocaleDateString()} -{" "}
                {new Date(trip.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {paginationInfo?.hasMore && (
        <button
          onClick={() =>
            setPagination((p) => ({
              ...p,
              offset: p.offset + p.limit,
            }))
          }
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Load More
        </button>
      )}
    </div>
  );
}

/**
 * Example 3: Current User Query
 *
 * Demonstrates useGetCurrentUserQuery (no variables required)
 */
function CurrentUserExample() {
  const [client] = useState(createGraphQLClient);

  const { data, isLoading, error } = useGetCurrentUserQuery(
    client,
    undefined, // No variables needed
    {
      // This query might change frequently, so shorter stale time
      staleTime: 30000, // 30 seconds
      // Retry failed requests more aggressively
      retry: 2,
    },
  );

  if (isLoading) {
    return (
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-gray-600">Loading current user...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-600">Not authenticated</p>
      </div>
    );
  }

  const me = data?.me;

  if (!me) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="text-yellow-700">No current user data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-indigo-50 p-4">
      <h3 className="mb-2 text-lg font-semibold text-indigo-800">
        Current User
      </h3>
      <p className="text-indigo-700">Welcome, {me.fullName}!</p>
      <p className="text-sm text-indigo-600">Role: {me.role}</p>
    </div>
  );
}

// =============================================================================
// Main Example Component
// =============================================================================

/**
 * GraphQLExample - Main demonstration component
 *
 * Combines all examples into a cohesive demonstration.
 */
export function GraphQLExample() {
  const [activeTab, setActiveTab] = useState<"user" | "trips" | "me">("user");

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">GraphQL Hooks Usage Examples</h1>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "user", label: "Get User by ID" },
            { id: "trips", label: "List Trips" },
            { id: "me", label: "Current User" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === "user" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              useGetUserQuery Example
            </h2>
            <p className="mb-4 text-gray-600">
              This example demonstrates fetching a user by ID with loading,
              error, and success states.
            </p>
            <UserExample />
          </section>
        )}

        {activeTab === "trips" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              useGetTripsQuery Example
            </h2>
            <p className="mb-4 text-gray-600">
              This example demonstrates fetching paginated trips with optional
              variables and query options.
            </p>
            <TripsExample />
          </section>
        )}

        {activeTab === "me" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              useGetCurrentUserQuery Example
            </h2>
            <p className="mb-4 text-gray-600">
              This example demonstrates fetching the currently authenticated
              user (no variables required).
            </p>
            <CurrentUserExample />
          </section>
        )}
      </div>

      <div className="mt-8 rounded-lg bg-gray-100 p-4">
        <h3 className="mb-2 font-semibold">Key Takeaways:</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>
            Generated hooks require a <code>GraphQLClient</code> instance as the
            first parameter
          </li>
          <li>
            Variables are passed as the second parameter (or undefined if not
            required)
          </li>
          <li>
            TanStack Query options (staleTime, enabled, etc.) are passed as the
            third parameter
          </li>
          <li>
            All hooks return standard TanStack Query result: {"{"} data,
            isLoading, error, refetch {"}"}
          </li>
          <li>Response data is fully typed based on your GraphQL schema</li>
        </ul>
      </div>
    </div>
  );
}

export default GraphQLExample;
