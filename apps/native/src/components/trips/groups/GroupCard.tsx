import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";
import type { GroupListItem } from "./types";

interface GroupCardProps {
  group: GroupListItem;
  onPress: (group: GroupListItem) => void;
  isMyGroup?: boolean;
}

export function GroupCard({ group, onPress, isMyGroup = false }: GroupCardProps) {
  return (
    <TouchableOpacity
      style={[styles.groupCard, isMyGroup ? styles.groupCardMine : null]}
      activeOpacity={0.8}
      onPress={() => onPress(group)}
    >
      <View style={styles.groupImageContainer}>
        {group.image ? (
          <Image
            source={{ uri: group.image }}
            style={styles.groupImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.groupImagePlaceholder}>
            <Ionicons name="images-outline" size={20} color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.groupInfo}>
        {isMyGroup ? (
          <View style={styles.myGroupBadge}>
            <Text style={styles.myGroupBadgeText}>Your group</Text>
          </View>
        ) : null}
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
  groupCardMine: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryOpacity10,
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
  groupImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(39, 41, 53, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  myGroupBadge: {
    alignSelf: "flex-start",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryOpacity20,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
  },
  myGroupBadgeText: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
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
