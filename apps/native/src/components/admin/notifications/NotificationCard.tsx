import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "~/styles";
import type { Notification } from "@mirai-app/trpc/hooks";

interface NotificationCardProps {
  notification: Notification;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
}

// Helper function to get display name from user object
const getDisplayName = (user: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
}): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  if ("name" in user && user.name) return user.name;
  return "Unknown User";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "sent":
      return { color: colors.success, text: "Sent" };
    case "failed":
      return { color: colors.danger, text: "Failed" };
    case "pending":
      return { color: colors.primary, text: "Pending" };
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
  const sentCount = notification.pushes.filter(
    (push) => push.status === "sent",
  ).length;
  const failedCount = notification.pushes.filter(
    (push) => push.status === "failed",
  ).length;
  const pendingCount = notification.pushes.filter(
    (push) => push.status === "pending",
  ).length;

  const statusBadge =
    failedCount > 0
      ? getStatusBadge("failed")
      : pendingCount > 0
        ? getStatusBadge("pending")
        : getStatusBadge("sent");

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

      <View style={styles.pushSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Sent</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {sentCount}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Failed</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>
            {failedCount}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            {pendingCount}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{notification.pushes.length}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.retryButton,
            failedCount === 0 && styles.disabledButton,
          ]}
          onPress={() => onRetry(notification.id)}
          disabled={isRetrying || failedCount === 0}
        >
          <Ionicons name="refresh" size={16} color={colors.white} />
          <Text style={styles.actionButtonText}>
            {isRetrying ? "Retrying..." : "Retry"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(notification.id)}
          disabled={isDeleting}
        >
          <Ionicons name="trash" size={16} color={colors.white} />
          <Text style={styles.actionButtonText}>
            {isDeleting ? "Deleting..." : "Delete"}
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
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
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
  pushSummary: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    alignItems: "center" as const,
    backgroundColor: colors.backgroundDark,
  },
  summaryLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
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
  actions: {
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
  retryButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: typography.sm,
    color: colors.white,
    fontWeight: typography.medium,
  },
});
