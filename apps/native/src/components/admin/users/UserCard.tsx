import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "~/styles";
import type { User } from "@mirai-app/graphql-types";

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  // GraphQL User type has firstName/lastName but may not have email/group/wrist fields yet
  // These are accessed safely with fallbacks until the schema is updated
  const userName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown User";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const groupName =
    (user as unknown as { group?: { name?: string } }).group?.name ??
    "Not selected";
  const isAdmin = user.role === "ADMIN";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const bannedUntil = (user as unknown as { bannedUntil?: string }).bannedUntil;
  const bannedUntilLabel = bannedUntil
    ? new Date(bannedUntil).toLocaleString()
    : null;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const isBanned =
    (user as unknown as { isBanned?: boolean }).isBanned ?? false;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const email = (user as unknown as { email?: string }).email;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const wristNumber = (user as unknown as { wristNumber?: string | number })
    .wristNumber;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const houseNumber = (user as unknown as { houseNumber?: string | number })
    .houseNumber;

  return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          {isBanned && bannedUntilLabel ? (
            <Text style={styles.userBanned}>
              Banned until {bannedUntilLabel}
            </Text>
          ) : null}
          <Text style={styles.userGroup}>Group: {groupName}</Text>
        </View>
        <View style={styles.userBadges}>
          {isAdmin && (
            <View style={[styles.badge, styles.adminBadge]}>
              <Ionicons
                name="shield-checkmark"
                size={12}
                color={colors.white}
              />
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.userActions}>
        <View style={styles.numberSummary}>
          <View style={styles.numberItem}>
            <Text style={styles.numberLabel}>Wrist #</Text>
            <Text style={styles.numberValue}>{wristNumber ?? "—"}</Text>
          </View>
          <View style={styles.numberItem}>
            <Text style={styles.numberLabel}>House #</Text>
            <Text style={styles.numberValue}>{houseNumber ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(user)}
          >
            <Ionicons name="create" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userBanned: {
    fontSize: typography.sm,
    color: colors.danger,
    marginBottom: spacing.xs,
    fontWeight: typography.medium,
  },
  userGroup: {
    fontSize: typography.sm,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  userBadges: {
    flexDirection: "row",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  adminBadge: {
    backgroundColor: colors.warning,
  },
  badgeText: {
    fontSize: typography.xs,
    color: colors.white,
    fontWeight: typography.medium,
  },
  userActions: {
    gap: spacing.md,
  },
  numberSummary: {
    flexDirection: "row",
    gap: spacing.md,
  },
  numberItem: {
    flex: 1,
  },
  numberLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  numberValue: {
    fontSize: typography.base,
    color: colors.white,
    fontWeight: typography.medium,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  assignButton: {
    backgroundColor: colors.primary,
  },
  editButton: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  actionButtonText: {
    fontSize: typography.sm,
    color: colors.white,
    fontWeight: typography.medium,
  },
});
