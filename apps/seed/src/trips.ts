import { createAuthUserByEmail, ensureGhostAuthUser } from "./auth";
import { supabase } from "./config/supabase";
import { env } from "./config/env";
import { getSeedSDK } from "./graphql-client";
import type { TripConfig, AuthUserByEmail } from "./types";
import { parseUsersCsv } from "./users";
import { joinPath } from "./utils/path";
import { readTextFile, readFile } from "./utils/fs";

// Service role key for admin operations via GraphQL
const SERVICE_ROLE_KEY = env.serviceRoleKey;

/**
 * Seed a trip with participants using GraphQL SDK
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
        const ext =
          tripConfig.background.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `trips/${tripConfig.key}/background.${ext}`;

        const { error } = await supabase.storage
          .from(env.imageBucket)
          .upload(storagePath, backgroundFile, {
            upsert: true,
            contentType: `image/${ext}`,
          });

        if (error) {
          console.warn(
            `✗ Background upload failed for ${tripConfig.name}: ${error.message}`,
          );
        } else {
          backgroundImagePath = storagePath;
          console.log(
            `✓ Uploaded background for ${tripConfig.name}: ${storagePath}`,
          );
        }
      }
    } catch (err) {
      console.warn(
        `✗ Failed to read background image ${tripConfig.background} for ${tripConfig.name}:`,
        err,
      );
    }
  }

  // Create or update trip via GraphQL
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
        console.warn(
          `✗ Supabase Auth user not found/created for ${email}, skipping DB user/participant.`,
        );
        continue;
      }
      authUsers.set(email.toLowerCase(), authUser);
    }

    // Create or update user via GraphQL
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
      console.warn(`✗ Failed to create/update user for ${email}`);
      continue;
    }

    // Add user as trip participant
    const participant = await addTripParticipantViaGraphQL({
      tripId: trip.id,
      userId: dbUser.id,
    });

    if (participant) {
      console.log(`✓ Added ${email} to trip ${tripConfig.name}`);
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
      console.log(`✓ Added ghost user to trip ${tripConfig.name}`);
    }
  }

  console.log(`Trip seeded: ${trip.name} (${users.length} participants)`);
  return trip;
};

// =============================================================================
// GraphQL SDK Operations
// =============================================================================

/**
 * Upsert trip via GraphQL API
 * Uses service account for admin operations
 */
async function upsertTripViaGraphQL(input: {
  key: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  backgroundImagePath?: string;
}) {
  const query = `
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

  try {
    const response = await fetch(env.graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Service-Account": "seed",
      },
      body: JSON.stringify({
        query,
        variables: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
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
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      console.warn("GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.upsertTrip ?? null;
  } catch (error) {
    console.error("Failed to upsert trip:", error);
    return null;
  }
}

/**
 * Upsert user via GraphQL API
 */
async function upsertUserViaGraphQL(input: {
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  const query = `
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

  try {
    const response = await fetch(env.graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Service-Account": "seed",
      },
      body: JSON.stringify({
        query,
        variables: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
        upsertUser: {
          id: string;
          authUserId: string;
          firstName: string;
          lastName: string;
          role: string;
          createdAt: string;
          updatedAt: string;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      console.warn("GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.upsertUser ?? null;
  } catch (error) {
    console.error("Failed to upsert user:", error);
    return null;
  }
}

/**
 * Add trip participant via GraphQL API
 */
async function addTripParticipantViaGraphQL(input: {
  tripId: string;
  userId: string;
}) {
  const query = `
    mutation AddTripParticipant($tripId: ID!, $userId: ID!) {
      addTripParticipant(input: { tripId: $tripId, userId: $userId }) {
        id
        tripId
        userId
        joinedAt
      }
    }
  `;

  try {
    const response = await fetch(env.graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Service-Account": "seed",
      },
      body: JSON.stringify({
        query,
        variables: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
        addTripParticipant: {
          id: string;
          tripId: string;
          userId: string;
          joinedAt: string;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      // Participant may already exist - that's ok
      if (result.errors.some((e) => e.message.includes("already exists"))) {
        return { id: "existing", ...input, joinedAt: new Date().toISOString() };
      }
      console.warn("GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.addTripParticipant ?? null;
  } catch (error) {
    console.error("Failed to add trip participant:", error);
    return null;
  }
}
