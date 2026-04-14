/**
 * Unified GraphQL Client for Seed Operations
 *
 * Provides a single, consistent interface for all GraphQL operations
 * with centralized error handling and type safety.
 *
 * @module graphql-executor
 */

import { serverLogger } from "@mirai-app/shared";
import type { DocumentNode } from "graphql";
import { env } from "./config/env";

// =============================================================================
// Configuration
// =============================================================================

const GRAPHQL_ENDPOINT = env.graphqlEndpoint;
const SERVICE_ROLE_KEY = env.serviceRoleKey;

// =============================================================================
// Authentication Headers
// =============================================================================

const getAuthHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "X-Service-Account": "seed",
});

// =============================================================================
// Core Execution Function
// =============================================================================

/**
 * Convert DocumentNode to string query
 */
const documentToString = (doc: string | DocumentNode): string => {
  if (typeof doc === "string") return doc;
  // Extract query string from DocumentNode
  return doc.loc?.source?.body || "";
};

/**
 * Execute a GraphQL operation
 * @returns The data on success, null on failure
 */
export async function executeGraphQL<
  TData = unknown,
  TVariables = Record<string, unknown>,
>(
  document: string | DocumentNode,
  variables?: TVariables,
): Promise<TData | null> {
  const query = documentToString(document);
  if (!query) {
    serverLogger.error("Empty GraphQL document");
    return null;
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      serverLogger.warn(`GraphQL HTTP error: ${response.status}`);
      return null;
    }

    const result = (await response.json()) as {
      data?: TData;
      errors?: Array<{ message: string }>;
    };

    if (result.errors && result.errors.length > 0) {
      // Check for "already exists" - not a real error for idempotent operations
      const nonDuplicateErrors = result.errors.filter(
        (e) => !e.message.toLowerCase().includes("already exists"),
      );

      if (nonDuplicateErrors.length > 0) {
        serverLogger.warn("GraphQL errors:", { errors: nonDuplicateErrors });
        return null;
      }
    }

    return result.data ?? null;
  } catch (error) {
    serverLogger.error(
      "GraphQL execution failed:",
      error instanceof Error ? error : new Error(String(error)),
    );
    return null;
  }
}

// =============================================================================
// Pre-defined Operation Documents
// =============================================================================

// ---------------------------------------
// Trip Operations
// ---------------------------------------

export const UpsertTripDocument = `
  mutation UpsertTrip(
    $key: String!
    $name: String!
    $description: String
    $startDate: DateTime!
    $endDate: DateTime!
    $backgroundImagePath: String
  ) {
    upsertTrip(
      input: {
        key: $key
        name: $name
        description: $description
        startDate: $startDate
        endDate: $endDate
        backgroundImagePath: $backgroundImagePath
      }
    ) {
      id
      name
      description
      startDate
      endDate
      backgroundImagePath
      createdAt
      updatedAt
    }
  }
`;

// ---------------------------------------
// User Operations
// ---------------------------------------

export const UpsertUserDocument = `
  mutation UpsertUser(
    $authUserId: String!
    $email: String!
    $firstName: String!
    $lastName: String!
    $role: UserRole!
  ) {
    upsertUser(
      input: {
        authUserId: $authUserId
        email: $email
        firstName: $firstName
        lastName: $lastName
        role: $role
      }
    ) {
      id
      authUserId
      firstName
      lastName
      role
      createdAt
      updatedAt
    }
  }
`;

export const FindUserByAuthIdDocument = `
  query FindUserByAuthId($authUserId: String!) {
    users(filter: { authUserId: $authUserId }) {
      id
      role
    }
  }
`;

// ---------------------------------------
// Trip Participant Operations
// ---------------------------------------

export const AddTripParticipantDocument = `
  mutation AddTripParticipant($tripId: ID!, $userId: ID!) {
    addTripParticipant(input: { tripId: $tripId, userId: $userId }) {
      id
      tripId
      userId
      joinedAt
    }
  }
`;

// ---------------------------------------
// Sponsor Operations
// ---------------------------------------

export const CreateSponsorDocument = `
  mutation CreateSponsor(
    $name: String!
    $description: String
    $website: String
    $logoUrl: String
  ) {
    createSponsor(
      input: {
        name: $name
        description: $description
        website: $website
        logoUrl: $logoUrl
      }
    ) {
      sponsor {
        id
        name
        description
        website
        logoUrl
        createdAt
      }
    }
  }
`;

export const FindSponsorByNameDocument = `
  query FindSponsorByName($name: String!) {
    sponsors(filter: { name: $name }) {
      id
      name
      description
      website
      logoUrl
      createdAt
    }
  }
`;

export const LinkSponsorToTripDocument = `
  mutation LinkSponsorToTrip($sponsorId: ID!, $tripId: ID!) {
    linkSponsorToTrip(input: { sponsorId: $sponsorId, tripId: $tripId }) {
      id
      sponsorId
      tripId
    }
  }
`;

// ---------------------------------------
// Reward Operations
// ---------------------------------------

export const CreateRewardDocument = `
  mutation CreateReward(
    $tripId: ID!
    $name: String!
    $description: String
    $type: String!
    $cost: Int
    $quantity: Int
    $imageUrl: String
  ) {
    createReward(
      input: {
        tripId: $tripId
        name: $name
        description: $description
        type: $type
        cost: $cost
        quantity: $quantity
        imageUrl: $imageUrl
      }
    ) {
      id
      tripId
      name
      description
      type
      cost
      quantity
      imageUrl
      createdAt
    }
  }
`;

// ---------------------------------------
// Trip Info Operations
// ---------------------------------------

export const ClearTripResourcesDocument = `
  mutation ClearTripResources($tripId: ID!) {
    deleteTripResources(where: { tripId: $tripId }) {
      count
    }
  }
`;

export const CreateTripResourceDocument = `
  mutation CreateTripResource(
    $tripId: ID!
    $type: String!
    $label: String!
    $description: String
    $url: String
    $storagePath: String
    $fileName: String
    $iconName: String
    $value: String
    $sortOrder: Int
  ) {
    createTripResource(
      input: {
        tripId: $tripId
        type: $type
        label: $label
        description: $description
        url: $url
        storagePath: $storagePath
        fileName: $fileName
        iconName: $iconName
        value: $value
        sortOrder: $sortOrder
      }
    ) {
      id
      tripId
      type
      label
      description
      url
      sortOrder
      createdAt
    }
  }
`;

export const ClearTripInsuranceDocument = `
  mutation ClearTripInsurance($tripId: ID!) {
    deleteTripInsurance(where: { tripId: $tripId }) {
      count
    }
  }
`;

export const CreateTripInsuranceDocument = `
  mutation CreateTripInsurance(
    $tripId: ID!
    $label: String!
    $phoneNumber: String!
    $phoneDisplay: String
    $policyNumber: String
    $contractNumber: String
    $providerName: String
    $hospitalName: String
    $hospitalAddress: String
    $hospitalDistance: String
  ) {
    createTripInsurance(
      input: {
        tripId: $tripId
        label: $label
        phoneNumber: $phoneNumber
        phoneDisplay: $phoneDisplay
        policyNumber: $policyNumber
        contractNumber: $contractNumber
        providerName: $providerName
        hospitalName: $hospitalName
        hospitalAddress: $hospitalAddress
        hospitalDistance: $hospitalDistance
      }
    ) {
      id
      tripId
      label
      phoneNumber
      createdAt
    }
  }
`;

export const CreateInsuranceStepDocument = `
  mutation CreateInsuranceStep(
    $insuranceId: ID!
    $stepNumber: Int!
    $title: String!
    $text: String!
    $requiredInfo: [String!]
    $exampleCall: String
    $additionalText: String
  ) {
    createInsuranceStep(
      input: {
        insuranceId: $insuranceId
        stepNumber: $stepNumber
        title: $title
        text: $text
        requiredInfo: $requiredInfo
        exampleCall: $exampleCall
        additionalText: $additionalText
      }
    ) {
      id
      insuranceId
      stepNumber
      title
      text
      createdAt
    }
  }
`;
