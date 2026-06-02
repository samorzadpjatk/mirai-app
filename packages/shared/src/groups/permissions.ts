export interface ValidationResult {
  error: string | null;
  message?: string;
}

export function canUpdateGroup(
  userRole: string,
  isOrganizer: boolean,
  wantsToChangeOrganizer: boolean,
): ValidationResult {
  const isAdmin = userRole === "ADMIN";

  if (!isAdmin && !isOrganizer) {
    return {
      error: "FORBIDDEN",
      message: "Only group organizer or admin can update this group",
    };
  }

  if (!isAdmin && wantsToChangeOrganizer) {
    return {
      error: "FORBIDDEN",
      message: "Only admin can change group organizer",
    };
  }

  return { error: null };
}

export function canRemoveUserFromGroup(
  userRole: string,
  isOrganizer: boolean,
  targetUserId: string,
  groupOrganizerId: string | null,
): ValidationResult {
  const isAdmin = userRole === "ADMIN";

  if (!isAdmin && !isOrganizer) {
    return {
      error: "FORBIDDEN",
      message: "Only group organizer or admin can remove members",
    };
  }

  if (!isAdmin && targetUserId === groupOrganizerId) {
    return {
      error: "FORBIDDEN",
      message: "Group leader cannot be removed by organizer",
    };
  }

  return { error: null };
}

export function canDeleteGroupAsOrganizer(
  groupOrganizerId: string | null,
  userId: string,
): ValidationResult {
  if (groupOrganizerId !== userId) {
    return {
      error: "FORBIDDEN",
      message: "Only group organizer can delete this group",
    };
  }
  return { error: null };
}

export function canViewJoinRequests(
  groupOrganizerId: string | null,
  userId: string,
): ValidationResult {
  if (groupOrganizerId !== userId) {
    return {
      error: "FORBIDDEN",
      message: "Only group organizer can view join requests",
    };
  }
  return { error: null };
}

export function isUserInGroup(
  userId: string,
  participants: Array<{ userId: string }>,
): boolean {
  return participants.some((member) => member.userId === userId);
}
