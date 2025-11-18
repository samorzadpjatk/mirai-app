export interface User {
  id: string;
  supabaseUserId: string | null;
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
  coinBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export type Role = "admin" | "moderator" | "service-account";
