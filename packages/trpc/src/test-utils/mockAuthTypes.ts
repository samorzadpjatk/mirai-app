import { type Role } from "@integral-2025-app/db";

export interface MockDbUser {
  id: string;
  authUserId: string | null;
  firstName: string | null;
  lastName: string | null;
  hasAvatar: boolean;
  role: Role;
  // Convenience flags used in tests
  isAdmin?: boolean;
  isModerator?: boolean;
  isServiceAccount?: boolean;
  wristNumber?: string | null;
  houseNumber?: string | null;
  groupId?: string | null;
}

export type MockGetUserFromDb = (
  authUserId: string,
) => Promise<MockDbUser | null>;
