import { useState } from 'react';
import { useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@mirai-app/trpc/client';

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

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'all';

const PAGE_SIZE = 50;

export function useAdminNotifications(tripId?: string) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const [status, setStatus] = useState<NotificationStatus>('all');

  const notificationsQueryInput = tripId ? { tripId } : undefined;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      ...trpc.notifications.getAll.queryOptions(notificationsQueryInput).queryKey,
      'infinite',
      PAGE_SIZE,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return trpcClient.notifications.getAll.query({
        ...(notificationsQueryInput ?? {}),
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const retryMutation = useMutation(trpc.notifications.retryNotification.mutationOptions({
    onSuccess: () => {
      void refetch();
    },
  }));

  const deleteMutation = useMutation(trpc.notifications.delete.mutationOptions({
    onSuccess: () => {
      void refetch();
    },
  }));

  const notifications = (data?.pages ?? []).flatMap((page) => page.notifications ?? []);

  const retryNotification = (notificationId: string) => {
    return retryMutation.mutateAsync({ notificationId });
  };

  const deleteNotification = (notificationId: string) => {
    return deleteMutation.mutateAsync({ notificationId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return { color: '#10b981', text: 'Sent' };
      case 'failed':
        return { color: '#ef4444', text: 'Failed' };
      case 'pending':
        return { color: '#3b82f6', text: 'Pending' };
      default:
        return { color: '#9ca3af', text: status };
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
