import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import type { GroupListItem } from "./types";
import { GROUP_PLACEHOLDER_IMAGE_URL } from "~/utils/storageAssets";

interface GroupCardProps {
  group: GroupListItem;
  onPress: (group: GroupListItem) => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const imageUri = group.image ?? GROUP_PLACEHOLDER_IMAGE_URL;

  return (
    <TouchableOpacity
      style={styles.groupCard}
      activeOpacity={0.8}
      onPress={() => onPress(group)}
    >
      <View style={styles.groupImageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.groupImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupCode}>{group.code}</Text>
      </View>

      <View style={styles.groupStats}>
        <Text style={styles.groupMemberCount}>{group.participantCount}</Text>
        <Text style={styles.groupMemberLabel}>MEMBERS</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  groupImageContainer: {
    position: "relative",
  },
  groupImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  groupInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  groupName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  groupCode: {
    fontSize: 12,
    fontWeight: typography.medium,
    color: colors.textMuted,
  },
  groupStats: {
    alignItems: "flex-end",
  },
  groupMemberCount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  groupMemberLabel: {
    fontSize: 9,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
