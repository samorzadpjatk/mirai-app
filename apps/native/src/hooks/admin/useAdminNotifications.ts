import { useState } from "react";
import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";

export interface Notification {
  id: string;
  tripId?: string | null;
  url: string;
  title: string;
  body: string;
  createdAt: Date | string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  pushes: {
    targetUserId: string;
    status: string;
    sentAt?: Date | null;
    failureReason?: string | null;
  }[];
}

export type NotificationStatus = "pending" | "sent" | "failed" | "all";

const PAGE_SIZE = 50;

export function buildNotificationQueryInput(
  notificationsQueryInput: { tripId: string } | undefined,
  pageParam: number,
) {
  const offset = typeof pageParam === "number" ? pageParam : 0;
  return {
    ...(notificationsQueryInput ?? {}),
    pagination: {
      limit: PAGE_SIZE,
      offset,
    },
  };
}

export function getNextNotificationPageParam(lastPage: {
  pagination?: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination?.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export function useAdminNotifications(tripId?: string) {
  const [status, setStatus] = useState<NotificationStatus>("all");

  const notificationsQueryInput = tripId ? { tripId } : undefined;

  const { data, isLoading, isFetchingNextPage, isRefetching, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.notifications.getAll.infiniteOptions({
        input: (pageParam: number) =>
          buildNotificationQueryInput(notificationsQueryInput, pageParam),
        initialPageParam: 0,
        getNextPageParam: getNextNotificationPageParam,
      }),
    );

  const retryMutation = useMutation(
    orpc.notifications.retryNotification.mutationOptions({
      onSuccess: () => {
        void refetch();
      },
    }),
  );

  const deleteMutation = useMutation(
    orpc.notifications.delete.mutationOptions({
      onSuccess: () => {
        void refetch();
      },
    }),
  );

  const notifications = (data?.pages ?? []).flatMap((page) => page.notifications ?? []);

  const retryNotification = (notificationId: string) => {
    return retryMutation.mutateAsync({ notificationId });
  };

  const deleteNotification = (notificationId: string) => {
    return deleteMutation.mutateAsync({ notificationId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return { color: "#10b981", text: "Sent" };
      case "failed":
        return { color: "#ef4444", text: "Failed" };
      case "pending":
        return { color: "#3b82f6", text: "Pending" };
      default:
        return { color: "#9ca3af", text: status };
    }
  };

  return {
    notifications,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    status,
    setStatus,
    retryNotification,
    deleteNotification,
    isRetrying: retryMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getStatusBadge,
  };
}
