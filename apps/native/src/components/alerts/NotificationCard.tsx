import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import type { NotificationItem } from "~/types/notifications";

interface NotificationCardProps {
  notification: NotificationItem;
  timeLabel: string;
}

export function NotificationCard({ notification, timeLabel }: NotificationCardProps) {
  return (
    <View style={styles.notificationCard}>
      <View style={styles.notificationIcon}>
        <Ionicons name="notifications" size={20} color={colors.primary} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationBody}>{notification.body}</Text>
        <View style={styles.notificationFooter}>
          {notification.createdBy && (
            <Text style={styles.notificationAuthor}>
              From: {notification.createdBy.firstName} {notification.createdBy.lastName}
            </Text>
          )}
          <Text style={styles.notificationTime}>{timeLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    flexDirection: "row",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: spacing.md,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  notificationBody: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  notificationAuthor: {
    fontSize: typography.xs,
    color: colors.primary,
  },
  notificationTime: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
});
