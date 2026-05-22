export type MapTheme = "dark" | "light";

export function getNextMapTheme(currentTheme: MapTheme): MapTheme {
  return currentTheme === "dark" ? "light" : "dark";
}

export function isValidCoordinate(coordinate: [number, number] | null): boolean {
  return coordinate !== null && coordinate.length === 2;
}

export function shouldCollapseList(isListExpanded: boolean): boolean {
  return isListExpanded;
}

export function buildFocusStateFromUser(user: { coordinate: [number, number] }): {
  followMode: "user";
  focusedCoordinate: [number, number];
} {
  return {
    followMode: "user",
    focusedCoordinate: [...user.coordinate],
  };
}

export interface SharingSettings {
  usersToShareWith?: { id: string; firstName?: string | null; lastName?: string | null; image?: string | null }[];
}

export function removeUserFromSharingUserIds(sharingUserIds: string[], userId: string): string[] {
  return sharingUserIds.filter((id) => id !== userId);
}

export function removeUserFromSharingSettings(
  sharingSettings: SharingSettings | null | undefined,
  userId: string,
): SharingSettings | null {
  if (!sharingSettings?.usersToShareWith) return null;
  const updatedUsersToShareWith = sharingSettings.usersToShareWith.filter(
    (user) => user.id !== userId,
  );
  return {
    ...sharingSettings,
    usersToShareWith: updatedUsersToShareWith,
  };
}
