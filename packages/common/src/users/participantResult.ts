import { formatDisplayName } from "./formatDisplayName";

export type UserRole = "USER" | "ADMIN" | "MODERATOR" | "SERVICE";

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  bannedUntil?: string;
  banReason?: string;
  isBanned?: boolean;
  emailVerified?: Date;
  hasName: boolean;
  hasEmail: boolean;
  isEmailVerified: boolean;
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
): PublicUser => {
  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";
  const email = user.authUserId ? (emailByAuthUserId.get(user.authUserId) ?? "") : "";

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
