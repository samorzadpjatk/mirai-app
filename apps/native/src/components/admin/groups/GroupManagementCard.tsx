import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';
import type { Group } from '@mirai-app/admin-hooks';

interface GroupManagementCardProps {
  group: Group;
  onEdit: (group: Group) => void;
}

export function GroupManagementCard({
  group,
  onEdit,
}: GroupManagementCardProps) {
  const organizerLabel = group.organizer
    ? `${group.organizer.firstName ?? ''} ${group.organizer.lastName ?? ''}`.trim() || 'Unknown'
    : 'Unassigned';

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.organizerInfo}>
            Organizer: {organizerLabel}
          </Text>
        </View>
        <View style={styles.groupBadges}>
          <View style={[styles.badge, styles.membersBadge]}>
            <Ionicons name="people" size={12} color={colors.white} />
            <Text style={styles.badgeText}>{group._count.participants}</Text>
          </View>
          <View style={[styles.badge, styles.coinsBadge]}>
            <Ionicons name="cash" size={12} color={colors.white} />
            <Text style={styles.badgeText}>{group.coins}</Text>
          </View>
        </View>
      </View>

      <View style={styles.groupActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(group)}
        >
          <Ionicons name="create" size={16} color={colors.white} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },
  groupHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  organizerInfo: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  groupBadges: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  membersBadge: {
    backgroundColor: colors.primary,
  },
  coinsBadge: {
    backgroundColor: colors.accentMagenta,
  },
  badgeText: {
    fontSize: typography.xs,
    color: colors.white,
    fontWeight: typography.medium,
  },
  groupActions: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  organizerButton: {
    backgroundColor: colors.accentMagenta,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    fontSize: typography.sm,
    color: colors.white,
    fontWeight: typography.medium,
  },
});
