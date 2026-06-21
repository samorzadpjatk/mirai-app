import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import LoadingScreen from "~/components/LoadingScreen";
import { ErrorState } from "~/components/common/ui";
import { CreateScheduleModal } from "~/components/notifications/CreateScheduleModal";
import { NotificationScheduleCard } from "~/components/notifications/NotificationScheduleCard";
import { NotificationsHeader } from "~/components/notifications/NotificationsHeader";
import type { NotificationScheduleItem } from "~/types/notifications";

export default function NotificationsScreen() {
  const router = useRouter();

  // Check user permissions
  const { data: currentUser, isLoading: isLoadingUser } = useQuery(
    orpc.user.getMy.queryOptions({ input: {} }),
  );

  // Redirect if user doesn't have access
  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      const hasAccess = currentUser?.role !== "USER";
      if (!hasAccess) {
        router.replace("/");
      }
    }
  }, [currentUser, isLoadingUser, router]);

  const {
    data: schedulesData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery(orpc.notificationSchedule.getAll.queryOptions({ input: {} }));

  const schedules = (schedulesData?.schedules ?? []) as NotificationScheduleItem[];

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleOpenCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateDialogOpen(false);
  };

  if (isLoading || isLoadingUser) {
    return <LoadingScreen message="Loading notifications..." />;
  }

  // Don't render if user doesn't have access
  if (
    currentUser?.role !== "ADMIN" &&
    currentUser?.role !== "MODERATOR" &&
    currentUser?.role !== "SERVICE"
  ) {
    return null;
  }

  if (isError) {
    return (
      <ErrorState
        title="Error loading notifications"
        message={error?.message ?? "Something went wrong"}
        onRetry={() => void refetch()}
        retryLabel="Try Again"
      />
    );
  }

  return (
    <View style={[styles.container]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#00ced1"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <NotificationsHeader onCreate={handleOpenCreate} />

        {/* Empty State */}
        {schedules.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No notification schedules found. Create your first schedule!
            </Text>
          </View>
        )}

        {/* Schedules List */}
        {schedules.map((schedule) => (
          <NotificationScheduleCard key={schedule.id} schedule={schedule} />
        ))}
      </ScrollView>

      {/* Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={isCreateDialogOpen}
        onClose={handleCloseModal}
        onCreated={() => void refetch()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#17181c",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  errorTitle: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorMessage: {
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#23262b",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  // Empty State
  emptyCard: {
    backgroundColor: "#23262b",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#374151",
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
  },
});
