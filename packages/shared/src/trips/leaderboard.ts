export interface Group {
  id: string;
  coins?: number | null;
  name?: string | null;
}

export interface LeaderboardInfo {
  position: number;
  pointsDifference: number;
  totalGroups: number;
  targetPosition: number | null;
  targetGroupName: string | null;
}

export const calculateLeaderboardInfo = (
  userGroup: Group | null,
  groups: Group[] | undefined,
): LeaderboardInfo | null => {
  if (!userGroup || !groups) return null;

  const sortedGroups = [...groups].sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));
  const position = sortedGroups.findIndex((g) => g.id === userGroup.id) + 1;

  let pointsDifference = 0;
  let targetPosition: number | null = null;
  let targetGroupName: string | null = null;

  if (position === 1 && sortedGroups.length > 1) {
    const secondPlace = sortedGroups[1];
    pointsDifference = (userGroup.coins ?? 0) - (secondPlace?.coins ?? 0);
    targetPosition = 2;
    targetGroupName = secondPlace?.name ?? null;
  } else if (position > 1) {
    const groupAhead = sortedGroups[position - 2];
    pointsDifference = (groupAhead?.coins ?? 0) - (userGroup.coins ?? 0);
    targetPosition = position - 1;
    targetGroupName = groupAhead?.name ?? null;
  }

  return {
    position,
    pointsDifference,
    totalGroups: sortedGroups.length,
    targetPosition,
    targetGroupName,
  };
};

export const findUserGroup = <T extends { user: { id: string }; group?: Group | null }>(
  currentUserId: string,
  participants: T[] | undefined,
): T | null => {
  if (!participants) return null;
  const participant = participants.find((p) => p.user.id === currentUserId);
  return participant ?? null;
};
