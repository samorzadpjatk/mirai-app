import type { SupabaseUser } from "@mirai-app/supabase";
import { z } from "zod";

export const roleSchema = z.enum(["USER", "ADMIN", "MODERATOR", "SERVICE"]);

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters")
  .max(100, "Must be at most 100 characters")
  .refine((value) => !/\d/.test(value), "Cannot contain digits");

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: z.infer<typeof roleSchema>;
  bannedUntil?: string;
  banReason?: string;
  isBanned?: boolean;
  emailVerified?: Date;
  hasName: boolean;
  hasEmail: boolean;
  isEmailVerified: boolean;
}

export const userWithAuthSelect = {
  id: true,
  authUserId: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

interface SupabaseAdminMetadata {
  ban_reason?: string | null;
  role?: string | null;
  [key: string]: unknown;
}

export interface SupabaseAdminUser extends SupabaseUser {
  banned_until?: string;
  app_metadata: SupabaseUser["app_metadata"] & SupabaseAdminMetadata;
}
