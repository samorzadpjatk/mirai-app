export interface MockSessionUser {
  id: string;
  email: string;
  name: string;
  authUserId: string;
  emailVerified: Date;
}

export interface MockSession {
  user: MockSessionUser;
  authUserId: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "bearer";
}

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
