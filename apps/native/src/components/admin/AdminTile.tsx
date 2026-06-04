import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface AdminTileProps {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  accentBg: string;
  route?: string;
  tripId?: string;
  onPress?: () => void;
}

export function AdminTile({
  title,
  subtitle,
  icon,
  accent,
  accentBg,
  route,
  tripId,
  onPress,
}: AdminTileProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!route) {
      return;
    }

    if (!tripId) {
      return;
    }

    router.push({
      pathname: route,
      params: { tripId },
    });
  };

  return (
    <TouchableOpacity
      testID="admin-tile"
      style={styles.tile}
      activeOpacity={0.9}
      onPress={handlePress}
      aria-label={`${title}: ${subtitle}`}
    >
      <View style={[styles.tileIcon, { backgroundColor: accentBg, borderColor: accent }]}>
        <Ionicons name={icon} size={24} color={accent} />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "47%",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tileTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  tileSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
});
