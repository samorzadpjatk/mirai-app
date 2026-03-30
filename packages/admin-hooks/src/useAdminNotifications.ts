"use client";

import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

const NOTIFICATIONS_PER_PAGE = 50;

export type NotificationStatus = "pending" | "sent" | "failed" | "all";
export type Notification = AdminNotification;

export interface AdminNotification {
  id: string;
  tripId: string | null;
  url: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  pushes: {
    targetUserId: string;
    status: string;
    sentAt: string | null;
    failureReason: string | null;
  }[];
}

interface NotificationsPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface NotificationsResponse {
  notifications: AdminNotification[];
  pagination: NotificationsPagination;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseNotification = (value: unknown): AdminNotification | null => {
  if (!isObject(value) || typeof value.id !== "string") {
    return null;
  }

  const createdByRaw = isObject(value.createdBy) ? value.createdBy : null;
  const createdBy = {
    id:
      createdByRaw && typeof createdByRaw.id === "string"
        ? createdByRaw.id
        : "",
    firstName:
      createdByRaw && typeof createdByRaw.firstName === "string"
        ? createdByRaw.firstName
        : null,
    lastName:
      createdByRaw && typeof createdByRaw.lastName === "string"
        ? createdByRaw.lastName
        : null,
  };

  const pushes = Array.isArray(value.pushes)
    ? value.pushes
        .map((push) => {
          if (!isObject(push) || typeof push.targetUserId !== "string") {
            return null;
          }
          return {
            targetUserId: push.targetUserId,
            status: typeof push.status === "string" ? push.status : "pending",
            sentAt: typeof push.sentAt === "string" ? push.sentAt : null,
            failureReason:
              typeof push.failureReason === "string"
                ? push.failureReason
                : null,
          };
        })
        .filter(
          (
            push,
          ): push is {
            targetUserId: string;
            status: string;
            sentAt: string | null;
            failureReason: string | null;
          } => push !== null,
        )
    : [];

  return {
    id: value.id,
    tripId: typeof value.tripId === "string" ? value.tripId : null,
    url: typeof value.url === "string" ? value.url : "",
    title: typeof value.title === "string" ? value.title : "",
    body: typeof value.body === "string" ? value.body : "",
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : new Date().toISOString(),
    createdBy,
    pushes,
  };
};

const parseNotificationsResponse = (value: unknown): NotificationsResponse => {
  if (!isObject(value)) {
    return {
      notifications: [],
      pagination: {
        total: 0,
        limit: NOTIFICATIONS_PER_PAGE,
        offset: 0,
        hasMore: false,
      },
    };
  }

  const notificationsRaw = Array.isArray(value.notifications)
    ? value.notifications
    : [];
  const notifications = notificationsRaw
    .map(parseNotification)
    .filter(
      (notification): notification is AdminNotification =>
        notification !== null,
    );
  const paginationRaw = isObject(value.pagination) ? value.pagination : {};

  return {
    notifications,
    pagination: {
      total:
        typeof paginationRaw.total === "number"
          ? paginationRaw.total
          : notifications.length,
      limit:
        typeof paginationRaw.limit === "number"
          ? paginationRaw.limit
          : NOTIFICATIONS_PER_PAGE,
      offset:
        typeof paginationRaw.offset === "number" ? paginationRaw.offset : 0,
      hasMore: Boolean(paginationRaw.hasMore),
    },
  };
};

export function useAdminNotifications(tripId?: string) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<NotificationStatus>("all");

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications", tripId ?? "all"],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const result = await trpc.notifications.getAll.query({
        tripId: tripId ?? "",
        pagination: {
          limit: NOTIFICATIONS_PER_PAGE,
          offset,
        },
      });

      return parseNotificationsResponse(result);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const notifications = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.notifications),
    [data?.pages],
  );

  const pagination = useMemo(
    () => data?.pages?.[data.pages.length - 1]?.pagination,
    [data],
  );

  const retryMutation = useMutation({
    mutationFn: (notificationId: string) =>
      trpc.notifications.retryNotification.mutate({
        notificationId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", tripId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) =>
      trpc.notifications.delete.mutate({ notificationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", tripId],
      });
    },
  });

  const groupsQuery = useQuery({
    queryKey: ["notifications", "groups", tripId],
    enabled: Boolean(tripId),
    queryFn: async () => {
      const result = await trpc.group.getAllNames.query({
        tripId: tripId ?? "",
      });
      if (!Array.isArray(result)) {
        return [] as { id: string; name: string }[];
      }

      return result
        .map((group) => {
          if (
            !isObject(group) ||
            typeof group.id !== "string" ||
            typeof group.name !== "string"
          ) {
            return null;
          }
          return { id: group.id, name: group.name };
        })
        .filter(
          (group): group is { id: string; name: string } => group !== null,
        );
    },
  });

  return {
    notifications,
    pagination,
    status,
    setStatus,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    retryNotification: retryMutation.mutateAsync,
    isRetrying: retryMutation.isPending,
    deleteNotification: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    groups: groupsQuery.data ?? [],
    groupsLoading: groupsQuery.isLoading,
  };
}
