import type { Ionicons } from "@expo/vector-icons";

export type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Resolves the icon name configured for a trip resource, falling back to a
 * sensible default when the resource carries none.
 */
export const getIconName = (
  iconName: string | null | undefined,
  fallback: IoniconName,
): IoniconName => {
  if (!iconName) return fallback;
  return iconName as IoniconName;
};
