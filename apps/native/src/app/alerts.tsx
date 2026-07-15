import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertsEmptyState } from "~/components/alerts/AlertsEmptyState";
import { AlertsHeader } from "~/components/alerts/AlertsHeader";
import { AlertsPagination } from "~/components/alerts/AlertsPagination";
import { NotificationCard } from "~/components/alerts/NotificationCard";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import type { NotificationItem } from "~/types/notifications";
import { spacing, typography } from "../styles";

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    ...orpc.notifications.getAllMy.queryOptions({
      input: {
        page,
        pageSize,
      },
    }),
  });

  const notifications = (data?.notifications ?? []) as NotificationItem[];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const formatDate = (date: Date | string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const emptyMessage = "You don't have any notifications yet.\nCheck back later!";

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={palette.primary}
          />
        }
      >
        {/* Header */}
        <AlertsHeader
          title="Notifications"
          subtitle={
            notifications.length > 0
              ? `${notifications.length} notifications`
              : "No new notifications"
          }
        />

        {/* Notifications List */}
        {isLoading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingStateText}>Loading notifications...</Text>
          </View>
        ) : notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                timeLabel={formatDate(notification.createdAt)}
              />
            ))}
          </View>
        ) : (
          <AlertsEmptyState title="No Notifications" message={emptyMessage} />
        )}

        {/* Pagination */}
        <AlertsPagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage(page - 1)}
          onNext={() => setPage(page + 1)}
        />
      </ScrollView>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    notificationsList: {
      gap: spacing.md,
    },
    loadingState: {
      alignItems: "center",
      paddingVertical: spacing.xxl * 2,
    },
    loadingStateText: {
      fontSize: typography.base,
      color: palette.textMuted,
    },
  });
}
