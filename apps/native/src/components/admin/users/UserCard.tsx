import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';
import type { User } from '~/hooks/admin/useAdminUsers';

interface UserCardProps {
  user: User;
  onUpdateWristNumber: (userId: string, wristNumber: string) => void;
  onUpdateHouseNumber: (userId: string, houseNumber: string) => void;
  onAssignGroup: (user: User) => void;
  onToggleAdmin: (user: User) => void;
}

export function UserCard({
  user,
  onUpdateWristNumber,
  onUpdateHouseNumber,
  onAssignGroup,
  onToggleAdmin,
}: UserCardProps) {
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') ?? user.email ?? 'Unknown User';
  const isAdmin = user.role === 'ADMIN';

  return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.group && (
            <Text style={styles.userGroup}>Group: {user.group.name}</Text>
          )}
        </View>
        <View style={styles.userBadges}>
          {isAdmin && (
            <View style={[styles.badge, styles.adminBadge]}>
              <Ionicons name="shield-checkmark" size={12} color={colors.white} />
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.userActions}>
        <View style={styles.numberInputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Wrist #</Text>
            <TextInput
              style={styles.numberInput}
              value={user.wristNumber?.toString() ?? ''}
              onChangeText={(value) => onUpdateWristNumber(user.id, value)}
              placeholder="None"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>House #</Text>
            <TextInput
              style={styles.numberInput}
              value={user.houseNumber?.toString() ?? ''}
              onChangeText={(value) => onUpdateHouseNumber(user.id, value)}
              placeholder="None"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.assignButton]}
            onPress={() => onAssignGroup(user)}
          >
            <Ionicons name="people" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isAdmin ? styles.removeAdminButton : styles.adminButton]}
            onPress={() => onToggleAdmin(user)}
          >
            <Ionicons name="shield" size={16} color={colors.white} />
            <Text style={styles.actionButtonText}>
              {isAdmin ? 'Remove Admin' : 'Make Admin'}
            </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  userGroup: {
    fontSize: typography.sm,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  userBadges: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
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
  numberInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  numberInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  assignButton: {
    backgroundColor: colors.primary,
  },
  adminButton: {
    backgroundColor: colors.success,
  },
  removeAdminButton: {
    backgroundColor: colors.warning,
  },
  actionButtonText: {
    fontSize: typography.sm,
    color: colors.white,
    fontWeight: typography.medium,
  },
});
