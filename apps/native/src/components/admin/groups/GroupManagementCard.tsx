import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Group } from "~/hooks/admin/useAdminGroups";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface GroupManagementCardProps {
  group: Group;
  onEdit: (group: Group) => void;
}

export function GroupManagementCard({ group, onEdit }: GroupManagementCardProps) {
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  const organizerLabel = group.organizer
    ? `${group.organizer.firstName ?? ""} ${group.organizer.lastName ?? ""}`.trim() || "Unknown"
    : "Unassigned";

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.organizerInfo}>Organizer: {organizerLabel}</Text>
        </View>
        <View style={styles.groupBadges}>
          <View style={[styles.badge, styles.membersBadge]}>
            <Ionicons name="people" size={12} color={palette.white} />
            <Text style={styles.badgeText}>{group._count.participants}</Text>
          </View>
          <View style={[styles.badge, styles.coinsBadge]}>
            <Ionicons name="cash" size={12} color={palette.white} />
            <Text style={styles.badgeText}>{group.coins}</Text>
          </View>
        </View>
      </View>

      <View style={styles.groupActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(group)}
        >
          <Ionicons name="create" size={16} color={palette.white} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    groupCard: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: palette.borderWhite5,
    },
    groupHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
      marginBottom: spacing.md,
    },
    groupInfo: {
      flex: 1,
    },
    groupName: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: palette.white,
      marginBottom: spacing.xs,
    },
    organizerInfo: {
      fontSize: typography.sm,
      color: palette.textSecondary,
    },
    groupBadges: {
      flexDirection: "row" as const,
      gap: spacing.sm,
    },
    badge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    membersBadge: {
      backgroundColor: palette.primary,
    },
    coinsBadge: {
      backgroundColor: palette.accentMagenta,
    },
    badgeText: {
      fontSize: typography.xs,
      color: palette.white,
      fontWeight: typography.medium,
    },
    groupActions: {
      flexDirection: "row" as const,
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
    },
    editButton: {
      backgroundColor: palette.primary,
    },
    organizerButton: {
      backgroundColor: palette.accentMagenta,
    },
    deleteButton: {
      backgroundColor: colors.danger,
    },
    actionButtonText: {
      fontSize: typography.sm,
      color: palette.white,
      fontWeight: typography.medium,
    },
  });
}
