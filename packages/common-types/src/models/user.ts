export interface User {
  id: string;
  authUserId: string | null;
  email: string | null;
  name: string | null;
  hasAvatar: boolean;
  wristNumber: string | null;
  houseNumber: string | null;
  role: Role;
  groupId: string | null;
  emailVerified: Date | null;
}

export type Role = "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
