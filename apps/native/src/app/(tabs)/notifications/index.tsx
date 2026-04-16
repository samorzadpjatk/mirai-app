import { useEffect, useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { YStack, Text } from "@mirai-app/ui";
import { useRouter } from "expo-router";
import {
  useGetCurrentUserQuery,
  useGetMyNotificationsQuery,
} from "@mirai-app/frameworks";
import { CreateScheduleModal } from "~/components/notifications/CreateScheduleModal";
import { NotificationScheduleCard } from "~/components/notifications/NotificationScheduleCard";
import { NotificationsHeader } from "~/components/notifications/NotificationsHeader";
import type { NotificationScheduleItem } from "~/types/notifications";

export default function NotificationsScreen() {
  const router = useRouter();

  // GraphQL query for current user (permission check) - using urql tuple pattern
  const [{ data: currentUserData, fetching: isLoadingUser }] =
    useGetCurrentUserQuery();
  const currentUser = currentUserData?.me;

  // GraphQL query for notifications - using urql tuple pattern
  const [
    { fetching: isLoading, error, fetching: isFetching },
    reexecuteNotifications,
  ] = useGetMyNotificationsQuery();
  const isError = !!error;

  // Redirect if user doesn't have access
  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      const hasAccess = currentUser?.role !== "USER";
      if (!hasAccess) {
        router.replace("/");
      }
    }
  }, [currentUser, isLoadingUser, router]);

  // Schedules would come from notifications query or separate query
  const schedules: NotificationScheduleItem[] = [];

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleOpenCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateDialogOpen(false);
  };

  if (isLoading || isLoadingUser) {
    return (
      <YStack
        flex={1}
        backgroundColor="#17181c"
        justifyContent="center"
        alignItems="center"
        padding="$4"
      >
        <ActivityIndicator size="large" color="#00ced1" />
        <Text marginTop="$4" color="#9ca3af" fontSize={14}>
          Loading notifications...
        </Text>
      </YStack>
    );
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
      <YStack
        flex={1}
        backgroundColor="#17181c"
        justifyContent="center"
        alignItems="center"
        padding="$4"
      >
        <Text color="#ef4444" fontSize={18} fontWeight="bold">
          Error loading notifications
        </Text>
        <Text color="#9ca3af" marginTop="$2" textAlign="center">
          {error?.message ?? "Something went wrong"}
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 16,
            backgroundColor: "#23262b",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() =>
            void reexecuteNotifications({ requestPolicy: "network-only" })
          }
        >
          <Text color="#ffffff" fontWeight="600">
            Try Again
          </Text>
        </TouchableOpacity>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="#17181c">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() =>
              void reexecuteNotifications({ requestPolicy: "network-only" })
            }
            tintColor="#00ced1"
          />
        }
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        {/* Header */}
        <NotificationsHeader onCreate={handleOpenCreate} />

        {/* Empty State */}
        {schedules.length === 0 && (
          <YStack
            backgroundColor="#23262b"
            borderRadius={12}
            padding="$6"
            borderWidth={1}
            borderColor="#374151"
          >
            <Text color="#9ca3af" textAlign="center">
              No notification schedules found. Create your first schedule!
            </Text>
          </YStack>
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
        onCreated={() =>
          void reexecuteNotifications({ requestPolicy: "network-only" })
        }
      />
    </YStack>
  );
}
