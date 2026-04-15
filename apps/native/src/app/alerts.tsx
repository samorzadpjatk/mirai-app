import { useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { useQuery } from "urql";
import { GetMyNotificationsDocument } from "@mirai-app/graphql-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertsEmptyState } from "~/components/alerts/AlertsEmptyState";
import { AlertsHeader } from "~/components/alerts/AlertsHeader";
import { AlertsPagination } from "~/components/alerts/AlertsPagination";
import { NotificationCard } from "~/components/alerts/NotificationCard";
import { YStack, Text } from "@mirai-app/ui";
import type { NotificationItem } from "~/types/notifications";

// Spacing values from Tamagui tokens for React Native styles
const spacing = {
  lg: 16,
  md: 12,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [{ data, fetching }, refetch] = useQuery({
    query: GetMyNotificationsDocument,
    variables: { page, pageSize },
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

  const emptyMessage =
    "You don't have any notifications yet.\nCheck back later!";

  return (
    <YStack flex={1} backgroundColor="$backgroundDark">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={fetching}
            onRefresh={refetch}
            tintColor="white"
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
        {fetching ? (
          <YStack alignItems="center" paddingVertical={spacing.xxl * 2}>
            <Text fontSize="$base" color="$textMuted">
              Loading notifications...
            </Text>
          </YStack>
        ) : notifications.length > 0 ? (
          <YStack gap="$md">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                timeLabel={formatDate(notification.createdAt)}
              />
            ))}
          </YStack>
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
    </YStack>
  );
}
