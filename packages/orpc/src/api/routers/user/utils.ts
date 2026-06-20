import { formatDisplayName } from "@mirai-app/common/users";
import type { z } from "zod";
import { resolveAuthEmail } from "../../../utils/authEmails";
import type { PublicUser, roleSchema } from "./types";

export const formatUserFullName = (user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) => {
  return (
    formatDisplayName(user?.firstName, user?.lastName, user?.email ?? "Unknown user") ??
    "Unknown user"
  );
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
): PublicUser => {
  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";
  const email = resolveAuthEmail(emailByAuthUserId, user.authUserId);

  return {
    id: user.id,
    firstName,
    lastName,
    role: user.role,
    email,
    hasName: Boolean(firstName.trim() || lastName.trim()),
    hasEmail: Boolean(email.trim()),
    isEmailVerified: false,
  };
};

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
      email: string;
      bannedUntil: string;
      banReason: string;
      isBanned: boolean;
    }
  >,
): PublicUser => {
  const summary = user.authUserId ? (authByAuthUserId.get(user.authUserId) ?? null) : null;
  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";
  const email = summary?.email ?? "";

  return {
    id: user.id,
    firstName,
    lastName,
    role: user.role,
    email,
    ...(summary?.bannedUntil ? { bannedUntil: summary.bannedUntil } : {}),
    ...(summary?.banReason ? { banReason: summary.banReason } : {}),
    isBanned: summary?.isBanned ?? false,
    hasName: Boolean(firstName.trim() || lastName.trim()),
    hasEmail: Boolean(email.trim()),
    isEmailVerified: false,
  };
};
