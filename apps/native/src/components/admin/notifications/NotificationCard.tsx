import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';
import type { Notification } from '~/hooks/admin/useAdminNotifications';

interface NotificationCardProps {
  notification: Notification;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
}

// Helper function to get display name from user object
const getDisplayName = (user: { firstName?: string; lastName?: string; name?: string }): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  if ('name' in user && user.name) return user.name;
  return 'Unknown User';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'sent':
      return { color: colors.success, text: 'Sent' };
    case 'failed':
      return { color: colors.danger, text: 'Failed' };
    case 'pending':
      return { color: colors.primary, text: 'Pending' };
    default:
      return { color: colors.textSecondary, text: status };
  }
};

export function NotificationCard({
  notification,
  onRetry,
  onDelete,
  isRetrying = false,
  isDeleting = false,
}: NotificationCardProps) {
  const statusBadge = getStatusBadge('pending'); // Default to pending for the main notification

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.creator}>
            By {getDisplayName(notification.createdBy)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: statusBadge.color }]}>
            {statusBadge.text}
          </Text>
        </View>
      </View>

      <Text style={styles.body}>{notification.body}</Text>
      
      <View style={styles.pushesSection}>
        <Text style={styles.pushesTitle}>Push Notifications ({notification.pushes.length})</Text>
        {notification.pushes.slice(0, 3).map((push, index) => {
          const pushStatusBadge = getStatusBadge(push.status);
          return (
            <View key={index} style={styles.pushItem}>
              <View style={styles.pushInfo}>
                <Text style={styles.targetUser}>
                  {getDisplayName(push.targetUser)}
                </Text>
                {push.failureReason && (
                  <Text style={styles.failureReason}>
                    {push.failureReason}
                  </Text>
                )}
              </View>
              <View style={[styles.pushStatus, { backgroundColor: pushStatusBadge.color }]}>
                <Text style={styles.pushStatusText}>{pushStatusBadge.text}</Text>
              </View>
            </View>
          );
        })}
        {notification.pushes.length > 3 && (
          <Text style={styles.moreText}>
            +{notification.pushes.length - 3} more...
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.retryButton]}
          onPress={() => onRetry(notification.id)}
          disabled={isRetrying}
        >
          <Ionicons name="refresh" size={16} color={colors.white} />
          <Text style={styles.actionButtonText}>
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(notification.id)}
          disabled={isDeleting}
        >
          <Ionicons name="trash" size={16} color={colors.white} />
          <Text style={styles.actionButtonText}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  creator: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },
  statusText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
  },
  body: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  pushesSection: {
    marginBottom: spacing.md,
  },
  pushesTitle: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  pushItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWhite5,
  },
  pushInfo: {
    flex: 1,
  },
  targetUser: {
    fontSize: typography.sm,
    color: colors.white,
    marginBottom: 2,
  },
  failureReason: {
    fontSize: typography.xs,
    color: colors.danger,
  },
  pushStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pushStatusText: {
    fontSize: typography.xs,
    color: colors.white,
    fontWeight: typography.medium,
  },
  moreText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actions: {
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
  retryButton: {
    backgroundColor: colors.primary,
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
