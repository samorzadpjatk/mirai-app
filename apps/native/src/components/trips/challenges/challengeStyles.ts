import { type ComponentProps } from "react";
import { type Ionicons } from "@expo/vector-icons";

export const getIconForChallenge = (name: string): ComponentProps<typeof Ionicons>["name"] => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("snow") || lowerName.includes("angel")) return "snow";
  if (lowerName.includes("photo") || lowerName.includes("peak")) return "image";
  if (lowerName.includes("toast") || lowerName.includes("team")) return "wine";
  if (lowerName.includes("legend") || lowerName.includes("local")) return "star";
  if (lowerName.includes("trail") || lowerName.includes("blazer")) return "compass";
  if (lowerName.includes("fire") || lowerName.includes("starter")) return "flame";
  if (lowerName.includes("night") || lowerName.includes("watch")) return "moon";
  if (lowerName.includes("city") || lowerName.includes("sprint")) return "walk";
  return "trophy";
};

export const getColorForPoints = (points: number): string => {
  if (points >= 150) return "#eab308";
  if (points >= 100) return "#00ced1";
  if (points >= 75) return "#ef4444";
  if (points >= 50) return "#60a5fa";
  return "#fb923c";
};
