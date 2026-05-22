import { formatDisplayName } from "@mirai-app/shared";
import { resolveAuthEmail } from "../../../utils/authEmails";
import type { PublicUser, roleSchema } from "./types";
import type { z } from "zod";

export const formatUserFullName = (user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) => {
  return formatDisplayName(user?.firstName, user?.lastName, user?.email ?? "Unknown user") ?? "Unknown user";
};

export const toPublicUser = (
  user: {
    id: string;
    authUserId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: z.infer<typeof roleSchema>;
  },
  emailByAuthUserId: Map<string, string | null>,
): PublicUser => ({
  id: user.id,
  firstName: user.firstName ?? null,
  lastName: user.lastName ?? null,
  role: user.role,
  email: resolveAuthEmail(emailByAuthUserId, user.authUserId),
});

export const toPublicUserWithAuthSummary = (
  user: {
    id: string;
    authUserId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: z.infer<typeof roleSchema>;
  },
  authByAuthUserId: Map<
    string,
    {
      email: string | null;
      bannedUntil: string | null;
      banReason: string | null;
      isBanned: boolean;
    }
  >,
): PublicUser => {
  const summary = user.authUserId ? (authByAuthUserId.get(user.authUserId) ?? null) : null;
  return {
    id: user.id,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    role: user.role,
    email: summary?.email ?? null,
    bannedUntil: summary?.bannedUntil ?? null,
    banReason: summary?.banReason ?? null,
    isBanned: summary?.isBanned ?? false,
  };
};
