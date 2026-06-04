import { formatDisplayName } from "./formatDisplayName";

export type UserRole = "USER" | "ADMIN" | "MODERATOR" | "SERVICE";

export interface PublicUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: UserRole;
  bannedUntil?: string | null;
  banReason?: string | null;
  isBanned?: boolean;
}

export const toPublicUser = (
  user: {
    id: string;
    authUserId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: UserRole;
  },
  emailByAuthUserId: Map<string, string | null>,
): PublicUser => ({
  id: user.id,
  firstName: user.firstName ?? null,
  lastName: user.lastName ?? null,
  role: user.role,
  email: user.authUserId ? (emailByAuthUserId.get(user.authUserId) ?? null) : null,
});

export const buildWristNumberConflictMessage = (
  wristNumber: string,
  existingUser: { firstName: string | null; lastName: string | null },
): string => {
  const displayName = formatDisplayName(existingUser.firstName, existingUser.lastName);
  return `Numer opaski ${wristNumber} jest już przypisany do użytkownika: ${displayName ?? "Nieznany użytkownik"}`;
};

export const assembleParticipantWithUser = (
  participant: {
    user: {
      id: string;
      authUserId?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      role: UserRole;
    };
    wristNumber: string | null;
    houseNumber: string | null;
    groupId: string | null;
    tripId: string | null;
  },
  emailMap: Map<string, string | null>,
): {
  user: PublicUser;
  wristNumber: string | null;
  houseNumber: string | null;
  groupId: string | null;
  tripId: string | null;
} => ({
  user: toPublicUser(participant.user, emailMap),
  wristNumber: participant.wristNumber,
  houseNumber: participant.houseNumber,
  groupId: participant.groupId,
  tripId: participant.tripId,
});
