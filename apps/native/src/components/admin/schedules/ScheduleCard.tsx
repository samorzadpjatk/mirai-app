import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "~/styles";
import type { NotificationSchedule } from "@repo/frameworks/trpc/hooks";

interface ScheduleCardProps {
  schedule: NotificationSchedule;
  onEdit: (schedule: NotificationSchedule) => void;
  onDelete: (schedule: NotificationSchedule) => void;
  onToggle: (schedule: NotificationSchedule) => void;
  onTrigger: (schedule: NotificationSchedule) => void;
  isToggling?: boolean;
}

export function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onToggle,
  onTrigger,
  isToggling = false,
}: ScheduleCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{schedule.name}</Text>
          <Text style={styles.triggerTime}>
            <Ionicons name="time" size={14} color={colors.textSecondary} />{" "}
            {schedule.triggerTime}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: schedule.isActive
                ? colors.success
                : colors.textSecondary,
            },
          ]}
        >
          <Text style={styles.statusText}>
            {schedule.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <Text style={styles.message} numberOfLines={2}>
        {schedule.message}
      </Text>

      <View style={styles.metaSection}>
        <Text style={styles.metaText}>
          Created: {new Date(schedule.createdAt).toLocaleDateString()}
        </Text>
        {schedule.lastTriggered && (
          <Text style={styles.metaText}>
            Last triggered:{" "}
            {new Date(schedule.lastTriggered).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(schedule)}
        >
          <Ionicons name="create" size={16} color={colors.white} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.triggerButton]}
          onPress={() => onTrigger(schedule)}
        >
          <Ionicons name="play" size={16} color={colors.white} />
          <Text style={styles.actionButtonText}>Trigger</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.toggleButton,
            {
              backgroundColor: schedule.isActive
                ? colors.warning
                : colors.success,
            },
          ]}
          onPress={() => onToggle(schedule)}
          disabled={isToggling}
        >
          <Ionicons
            name={schedule.isActive ? "pause" : "play"}
            size={16}
            color={colors.white}
          />
          <Text style={styles.actionButtonText}>
            {isToggling ? "..." : schedule.isActive ? "Pause" : "Start"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(schedule)}
        >
          <Ionicons name="trash" size={16} color={colors.white} />
          <Text style={styles.actionButtonText}>Delete</Text>
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
  triggerTime: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.xs,
    color: colors.white,
    fontWeight: typography.medium,
  },
  message: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  metaSection: {
    marginBottom: spacing.md,
  },
  metaText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: 2,
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
    minHeight: 36,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  triggerButton: {
    backgroundColor: colors.accentMagenta,
  },
  toggleButton: {
    backgroundColor: colors.success,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    fontSize: typography.xs,
    color: colors.white,
    fontWeight: typography.medium,
  },
});
