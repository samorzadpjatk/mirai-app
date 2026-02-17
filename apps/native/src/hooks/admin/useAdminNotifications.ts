import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: Date | string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  pushes: {
    status: 'sent' | 'failed' | 'pending';
    sentAt?: Date | null;
    failureReason?: string | null;
    targetUser: {
      id: string;
      firstName?: string;
      lastName?: string;
    };
  }[];
}

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'all';

export function useAdminNotifications() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatus>('all');

  const { data: result, isLoading, refetch } = useQuery(
    trpc.notifications.getAll.queryOptions({
      page,
      pageSize: 20,
    })
  );

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

  const notifications = result?.notifications ?? [];
  const pagination = result?.pagination;

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
    pagination,
    isLoading,
    page,
    status,
    setPage,
    setStatus,
    retryNotification,
    deleteNotification,
    isRetrying: retryMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getStatusBadge,
  };
}
