import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

interface UserAvatarProps {
  /**
   * User's avatar URL. If null/undefined, shows initials.
   */
  imageUrl?: string | null;
  /**
   * User's full name (e.g., "John Doe").
   * Used to extract initials if no image.
   */
  name: string;
  /**
   * Size of the avatar (default: 38)
   */
  size?: number;
}

/**
 * Extract initials from full name.
 * Examples:
 *  - "John Doe" -> "JD"
 *  - "Alice" -> "A"
 *  - "Bob Smith Johnson" -> "BS"
 */
function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0]![0]!.toUpperCase();
  }

  const first = parts[0]![0] ?? "";
  const last = parts[parts.length - 1]![0];
  return (first + last).toUpperCase();
}

/**
 * Generate a consistent color based on the name string.
 * Uses simple hash to pick from predefined palette.
 */
function getColorFromName(name: string): string {
  const colors = [
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#F59E0B", // amber
    "#10B981", // emerald
    "#3B82F6", // blue
    "#EF4444", // red
    "#06B6D4", // cyan
    "#F97316", // orange
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index]!;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  imageUrl,
  name,
  size = 38,
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const hasImage = imageUrl && imageUrl.trim().length > 0;


  if (hasImage && !hasImageError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        onError={() => setHasImageError(true)}
      />
    );
  }

  // Show initials with generated color
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  const fontSize = size * 0.4; // 40% of size

  return (
    <View
      style={[
        styles.initialsContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
  initialsContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
});
