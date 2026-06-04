import { groups, tripParticipants, trips, users } from "@mirai-app/db";
import type { DB, Role } from "@mirai-app/db";
import type { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { vi } from "vitest";

export type MockSupabase = {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    admin: {
      getUserById: ReturnType<typeof vi.fn>;
      listUsers: ReturnType<typeof vi.fn>;
      createUser: ReturnType<typeof vi.fn>;
      updateUserById: ReturnType<typeof vi.fn>;
      deleteUser: ReturnType<typeof vi.fn>;
    };
  };
  storage: {
    from: () => {
      createSignedUrl: () => Promise<{
        data: { signedUrl: string };
        error: null;
      }>;
    };
  };
};

export function createMockSupabase(
  emails: Record<string, string> = {},
  _options: { withAdmin?: boolean; withStorage?: boolean } = {},
): MockSupabase {
  const userMap: Record<
    string,
    {
      id: string;
      email: string;
      banned_until?: string;
      app_metadata?: Record<string, unknown>;
    }
  > = {};

  for (const [authUserId, email] of Object.entries(emails)) {
    userMap[authUserId] = { id: authUserId, email };
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      admin: {
        getUserById: vi.fn().mockImplementation(async (id: string) => {
          const user = userMap[id];
          return {
            data: {
              user: user
                ? {
                    id: user.id,
                    email: user.email,
                    banned_until: user.banned_until,
                    app_metadata: user.app_metadata ?? {},
                  }
                : null,
            },
            error: null,
          };
        }),
        listUsers: vi.fn().mockResolvedValue({
          data: { users: Object.values(userMap) },
          error: null,
        }),
        createUser: vi.fn().mockImplementation(async ({ email }: { email: string }) => {
          const id = crypto.randomUUID();
          userMap[id] = { id, email };
          return { data: { user: { id, email } }, error: null };
        }),
        updateUserById: vi.fn().mockImplementation(
          async (
            id: string,
            updates: {
              ban_duration?: string;
              app_metadata?: Record<string, unknown>;
            },
          ) => {
            if (userMap[id]) {
              userMap[id] = {
                ...userMap[id],
                ...updates,
                app_metadata: {
                  ...(userMap[id].app_metadata ?? {}),
                  ...(updates.app_metadata ?? {}),
                },
              };
            }
            return { data: { user: userMap[id] }, error: null };
          },
        ),
        deleteUser: vi.fn().mockImplementation(async (id: string) => {
          delete userMap[id];
          return { data: null, error: null };
        }),
      },
    },
    storage: {
      from: () => ({
        createSignedUrl: async () => ({
          data: { signedUrl: "https://signed-url.example.com/image.jpg" },
          error: null,
        }),
      }),
    },
  };
}

export function createContext(
  testDb: Awaited<ReturnType<typeof createPgliteTestDb>>,
  overrides: Partial<{
    dbUser: { id: string; role: string };
    emails: Record<string, string>;
  }> = {},
) {
  const dbUser = overrides.dbUser ?? { id: "mod-1", role: "MODERATOR" };
  const supabase = createMockSupabase(overrides.emails ?? {});
  return {
    db: testDb.db,
    supabase,
    dbUser,
    accessToken: "test-token",
    headers: new Headers(),
  };
}

export async function seedUser(
  db: DB,
  id: string,
  authUserId = `auth-${id}`,
  firstName = "Test",
  lastName = "User",
  role?: Role,
) {
  await db.insert(users).values({
    id,
    authUserId,
    firstName,
    lastName,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function seedTrip(db: DB, id: string, name: string, description?: string) {
  await db.insert(trips).values({
    id,
    name,
    description,
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-07"),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function seedGroup(
  db: DB,
  id: string,
  tripId: string,
  name: string,
  organizerId: string,
  code: string,
) {
  await db.insert(groups).values({
    id,
    tripId,
    name,
    organizerId,
    code,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function seedParticipant(
  db: DB,
  id: string,
  userId: string,
  tripId: string,
  groupId?: string,
  wristNumber?: string,
  houseNumber?: string,
) {
  await db.insert(tripParticipants).values({
    id,
    userId,
    tripId,
    groupId,
    wristNumber,
    houseNumber,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
