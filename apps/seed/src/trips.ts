import { serverLogger } from "@mirai-app/shared";
import { createAuthUserByEmail, ensureGhostAuthUser } from "./auth";
import { getSupabaseClient } from "./config/supabase";
import { env } from "./config/env";
import { seedUrqlClient } from "./graphql-client";
import type { TripConfig, AuthUserByEmail } from "./types";
import { parseUsersCsv } from "./users";
import { joinPath } from "./utils/path";
import { readTextFile, readFile } from "./utils/fs";

// =============================================================================
// GraphQL Operation Documents
// =============================================================================

const UpsertTripDocument = `
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

const UpsertUserDocument = `
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

const AddTripParticipantDocument = `
  mutation AddTripParticipant($tripId: ID!, $userId: ID!) {
    addTripParticipant(input: { tripId: $tripId, userId: $userId }) {
      id
      tripId
      userId
      joinedAt
    }
  }
`;

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

const ROLE_MAPPING: Record<string, string> = {
  admin: "ADMIN",
  moderator: "MODERATOR",
  service: "SERVICE",
  user: "USER",
};

export const seedTrip = async (
  tripConfig: TripConfig,
  usersCsvPath: string,
  envRoot: string,
  authUsers: AuthUserByEmail,
) => {
  const usersCsv = await readTextFile(joinPath(envRoot, usersCsvPath));
  const users = parseUsersCsv(usersCsv);

  // Handle background image upload
  const backgroundImagePath = await uploadBackgroundImage(tripConfig, envRoot);

  // Create or update trip
  const trip = await executeMutation<UpsertTripResponse>(
    UpsertTripDocument,
    {
      key: tripConfig.key,
      name: tripConfig.name,
      description: tripConfig.description,
      startDate: new Date(tripConfig.startDate).toISOString(),
      endDate: new Date(tripConfig.endDate).toISOString(),
      backgroundImagePath,
    },
    "upsertTrip",
  );

  if (!trip) {
    throw new Error(`Failed to create/update trip: ${tripConfig.name}`);
  }

  // Process users and add them to trip
  for (const row of users) {
    const email = row.email?.trim();
    if (!email) continue;

    const authUser = await getOrCreateAuthUser(email, row, authUsers);
    if (!authUser) continue;

    const dbRole = ROLE_MAPPING[row.role?.toLowerCase() || "user"] || "USER";

    const dbUser = await executeMutation<UpsertUserResponse>(
      UpsertUserDocument,
      {
        authUserId: authUser.id,
        email,
        firstName: row.firstName ?? "",
        lastName: row.lastName ?? "",
        role: dbRole,
      },
      "upsertUser",
    );

    if (!dbUser) {
      serverLogger.warn(`✗ Failed to create/update user for ${email}`);
      continue;
    }

    const participant = await executeMutation<AddTripParticipantResponse>(
      AddTripParticipantDocument,
      { tripId: trip.id, userId: dbUser.id },
      "addTripParticipant",
      true,
    );

    if (participant) {
      serverLogger.info(`✓ Added ${email} to trip ${tripConfig.name}`);
    }
  }

  // Add ghost user
  await addGhostUserToTrip(trip.id, tripConfig.name, authUsers);

  serverLogger.info(`Trip seeded: ${trip.name} (${users.length} participants)`);
  return trip;
};

// =============================================================================
// Helper Functions
// =============================================================================

async function uploadBackgroundImage(
  tripConfig: TripConfig,
  envRoot: string,
): Promise<string | undefined> {
  if (!tripConfig.background) return undefined;

  const backgroundAbsPath = joinPath(envRoot, tripConfig.background);
  try {
    const backgroundFile = readFile(backgroundAbsPath);
    const { size } = await backgroundFile.stat();

    if (size === 0) return undefined;

    const client = getSupabaseClient();
    const ext = tripConfig.background.split(".").pop()?.toLowerCase() || "jpg";
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
      return undefined;
    }

    serverLogger.info(
      `✓ Uploaded background for ${tripConfig.name}: ${storagePath}`,
    );
    return storagePath;
  } catch (err) {
    serverLogger.warn(
      `✗ Failed to read background image ${tripConfig.background}: ${String(err)}`,
    );
    return undefined;
  }
}

async function getOrCreateAuthUser(
  email: string,
  row: { firstName?: string; lastName?: string; role?: string },
  authUsers: AuthUserByEmail,
) {
  let authUser = authUsers.get(email.toLowerCase()) ?? null;
  if (!authUser) {
    authUser = await createAuthUserByEmail(
      email,
      row.firstName ?? "",
      row.lastName ?? "",
      row.role ?? "user",
    );
    if (!authUser) {
      serverLogger.warn(`✗ Supabase Auth user not found/created for ${email}`);
      return null;
    }
    authUsers.set(email.toLowerCase(), authUser);
  }
  return authUser;
}

async function addGhostUserToTrip(
  tripId: string,
  tripName: string,
  authUsers: AuthUserByEmail,
) {
  const ghostAuth = await ensureGhostAuthUser(authUsers);
  if (!ghostAuth) return;

  const ghostUser = await executeMutation<UpsertUserResponse>(
    UpsertUserDocument,
    {
      authUserId: ghostAuth.id,
      email: env.seedGhostEmail,
      firstName: "Ghost",
      lastName: "User",
      role: "USER",
    },
    "upsertUser",
  );

  if (ghostUser) {
    await executeMutation<AddTripParticipantResponse>(
      AddTripParticipantDocument,
      { tripId, userId: ghostUser.id },
      "addTripParticipant",
      true,
    );
    serverLogger.info(`✓ Added ghost user to trip ${tripName}`);
  }
}

async function executeMutation<TResponse>(
  document: string,
  variables: Record<string, unknown>,
  operationName: string,
  allowAlreadyExists = false,
): Promise<TResponse[keyof TResponse] | null> {
  try {
    const result = await seedUrqlClient.mutation<TResponse>(
      document,
      variables,
    );

    if (result.error) {
      if (
        allowAlreadyExists &&
        result.error.message?.includes("already exists")
      ) {
        return {
          id: "existing",
          ...variables,
        } as unknown as TResponse[keyof TResponse];
      }
      serverLogger.warn(`GraphQL error (${operationName})`, {
        error: result.error,
      });
      return null;
    }

    const key = Object.keys(result.data || {})[0] as keyof TResponse;
    return result.data?.[key] ?? null;
  } catch (error) {
    serverLogger.error(
      `Failed ${operationName}:`,
      error instanceof Error ? error : new Error(String(error)),
    );
    return null;
  }
}
