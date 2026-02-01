import { type ComponentProps } from "react";
import { type MaterialIcons } from "@expo/vector-icons";

export const getIconForChallenge = (
  name: string,
): ComponentProps<typeof MaterialIcons>["name"] => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("snow") || lowerName.includes("angel"))
    return "ac-unit";
  if (lowerName.includes("photo") || lowerName.includes("peak"))
    return "landscape";
  if (lowerName.includes("toast") || lowerName.includes("team"))
    return "local-bar";
  if (lowerName.includes("legend") || lowerName.includes("local"))
    return "star";
  if (lowerName.includes("trail") || lowerName.includes("blazer"))
    return "explore";
  if (lowerName.includes("fire") || lowerName.includes("starter"))
    return "local-fire-department";
  if (lowerName.includes("night") || lowerName.includes("watch"))
    return "bedtime";
  if (lowerName.includes("city") || lowerName.includes("sprint"))
    return "directions-run";
  return "emoji-events";
};

export const getColorForPoints = (points: number): string => {
  if (points >= 150) return "#eab308";
  if (points >= 100) return "#00ced1";
  if (points >= 75) return "#ef4444";
  if (points >= 50) return "#60a5fa";
  return "#fb923c";
};
