export interface MockDbUser {
  id: string;
  authUserId: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
  wristNumber: string | null;
  houseNumber: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  isServiceAccount: boolean;
  groupId: string | null;
  emailVerified: Date | null;
}

export type MockGetUserFromDb = (authUserId: string) => Promise<MockDbUser | null>;
