import { serverLogger } from "@mirai-app/shared";
import { createAuthUserByEmail, ensureGhostAuthUser } from "./auth";
import { getSupabaseClient } from "./config/supabase";
import { env } from "./config/env";
import { seedUrqlClient } from "./graphql-client";
import type { TripConfig, AuthUserByEmail } from "./types";
import { parseUsersCsv } from "./users";
import { joinPath } from "./utils/path";
import { readTextFile, readFile } from "./utils/fs";
import { gql } from "graphql-tag";

// =============================================================================
// GraphQL Operation Documents
// =============================================================================

const UpsertTripDocument = gql`
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

const UpsertUserDocument = gql`
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

const AddTripParticipantDocument = gql`
  mutation AddTripParticipant($tripId: ID!, $userId: ID!) {
    addTripParticipant(input: { tripId: $tripId, userId: $userId }) {
      id
      tripId
      userId
      joinedAt
    }
  }
`;

// Types for GraphQL responses
interface UpsertTripResponse {
  upsertTrip: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    backgroundImagePath?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface UpsertUserResponse {
  upsertUser: {
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface AddTripParticipantResponse {
  addTripParticipant: {
    id: string;
    tripId: string;
    userId: string;
    joinedAt: string;
  };
}

// =============================================================================
// Trip Seeding
// =============================================================================

/**
 * Seed a trip with participants using GraphQL via urql
 * Uses service account authentication for admin-level operations
 */
export const seedTrip = async (
  tripConfig: TripConfig,
  usersCsvPath: string,
  envRoot: string,
  authUsers: AuthUserByEmail,
) => {
  const usersCsv = await readTextFile(joinPath(envRoot, usersCsvPath));
  const users = parseUsersCsv(usersCsv);

  // Handle background image upload if specified
  let backgroundImagePath: string | undefined;
  if (tripConfig.background) {
    const backgroundAbsPath = joinPath(envRoot, tripConfig.background);
    try {
      const backgroundFile = readFile(backgroundAbsPath);
      const { size } = await backgroundFile.stat();

      if (size > 0) {
        // Generate storage path: trips/{trip-key}/background.{ext}
        const client = getSupabaseClient();
        const ext =
          tripConfig.background.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `trips/${tripConfig.key}/background.${ext}`;

        const { error } = await client.storage
          .from(env.imageBucket)
          .upload(storagePath, backgroundFile, {
            upsert: true,
            contentType: `image/${ext}`,
          });

        if (error) {
          serverLogger.warn(
            `✗ Background upload failed for ${tripConfig.name}: ${error.message}`,
          );
        } else {
          backgroundImagePath = storagePath;
          serverLogger.info(
            `✓ Uploaded background for ${tripConfig.name}: ${storagePath}`,
          );
        }
      }
    } catch (err) {
      serverLogger.warn(
        `✗ Failed to read background image ${tripConfig.background} for ${tripConfig.name}: ${String(err)}`,
      );
    }
  }

  // Create or update trip via GraphQL using urql
  const trip = await upsertTripViaGraphQL({
    key: tripConfig.key,
    name: tripConfig.name,
    description: tripConfig.description,
    startDate: new Date(tripConfig.startDate),
    endDate: new Date(tripConfig.endDate),
    backgroundImagePath,
  });

  if (!trip) {
    throw new Error(`Failed to create/update trip: ${tripConfig.name}`);
  }

  // Process users and add them to trip
  for (const row of users) {
    const email = row.email?.trim();
    if (!email) continue;

    let authUser = authUsers.get(email.toLowerCase()) ?? null;
    if (!authUser) {
      authUser = await createAuthUserByEmail(
        email,
        row.firstName ?? "",
        row.lastName ?? "",
        row.role ?? "user",
      );
      if (!authUser) {
        serverLogger.warn(
          `✗ Supabase Auth user not found/created for ${email}, skipping DB user/participant.`,
        );
        continue;
      }
      authUsers.set(email.toLowerCase(), authUser);
    }

    // Create or update user via GraphQL using urql
    const roleMapping: Record<string, string> = {
      admin: "ADMIN",
      moderator: "MODERATOR",
      service: "SERVICE",
      user: "USER",
    };

    const dbRole = roleMapping[row.role?.toLowerCase() || "user"] || "USER";

    const dbUser = await upsertUserViaGraphQL({
      authUserId: authUser.id,
      email,
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
      role: dbRole,
    });

    if (!dbUser) {
      serverLogger.warn(`✗ Failed to create/update user for ${email}`);
      continue;
    }

    // Add user as trip participant using urql
    const participant = await addTripParticipantViaGraphQL({
      tripId: trip.id,
      userId: dbUser.id,
    });

    if (participant) {
      serverLogger.info(`✓ Added ${email} to trip ${tripConfig.name}`);
    }
  }

  // Add ghost user to trip
  const ghostAuth = await ensureGhostAuthUser(authUsers);
  if (ghostAuth) {
    const ghostUser = await upsertUserViaGraphQL({
      authUserId: ghostAuth.id,
      email: env.seedGhostEmail,
      firstName: "Ghost",
      lastName: "User",
      role: "USER",
    });

    if (ghostUser) {
      await addTripParticipantViaGraphQL({
        tripId: trip.id,
        userId: ghostUser.id,
      });
      serverLogger.info(`✓ Added ghost user to trip ${tripConfig.name}`);
    }
  }

  serverLogger.info(`Trip seeded: ${trip.name} (${users.length} participants)`);
  return trip;
};

// =============================================================================
// GraphQL Operations via urql
// =============================================================================

/**
 * Upsert trip via GraphQL API using urql
 * Uses service account for admin operations
 */
async function upsertTripViaGraphQL(input: {
  key: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  backgroundImagePath?: string;
}) {
  try {
    const result = await seedUrqlClient.mutation<UpsertTripResponse>(
      UpsertTripDocument,
      {
        key: input.key,
        name: input.name,
        description: input.description,
        startDate: input.startDate.toISOString(),
        endDate: input.endDate.toISOString(),
        backgroundImagePath: input.backgroundImagePath,
      },
    );

    if (result.error) {
      serverLogger.warn("GraphQL error (upsertTrip)", { error: result.error });
      return null;
    }

    return result.data?.upsertTrip ?? null;
  } catch (error) {
    console.error("Failed to upsert trip:", error);
    return null;
  }
}

/**
 * Upsert user via GraphQL API using urql
 */
async function upsertUserViaGraphQL(input: {
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  try {
    const result = await seedUrqlClient.mutation<UpsertUserResponse>(
      UpsertUserDocument,
      {
        authUserId: input.authUserId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
    );

    if (result.error) {
      serverLogger.warn("GraphQL error (upsertUser)", { error: result.error });
      return null;
    }

    return result.data?.upsertUser ?? null;
  } catch (error) {
    console.error("Failed to upsert user:", error);
    return null;
  }
}

/**
 * Add trip participant via GraphQL API using urql
 */
async function addTripParticipantViaGraphQL(input: {
  tripId: string;
  userId: string;
}) {
  try {
    const result = await seedUrqlClient.mutation<AddTripParticipantResponse>(
      AddTripParticipantDocument,
      {
        tripId: input.tripId,
        userId: input.userId,
      },
    );

    if (result.error) {
      // Participant may already exist - that's ok
      if (result.error.message?.includes("already exists")) {
        return {
          id: "existing",
          ...input,
          joinedAt: new Date().toISOString(),
        };
      }
      serverLogger.warn("GraphQL error (addTripParticipant)", {
        error: result.error,
      });
      return null;
    }

    return result.data?.addTripParticipant ?? null;
  } catch (error) {
    console.error("Failed to add trip participant:", error);
    return null;
  }
}
