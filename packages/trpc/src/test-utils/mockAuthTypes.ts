import type { Role } from "@integral-2025-app/db/prisma";

export interface MockDbUser {
  id: string;
  authUserId: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
  role: Role;
  emailVerified: Date | null;
}

export type MockGetUserFromDb = (
  authUserId: string,
) => Promise<MockDbUser | null>;
