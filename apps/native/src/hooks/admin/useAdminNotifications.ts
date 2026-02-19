import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

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

export function useAdminNotifications(tripId?: string) {
  const trpc = useTRPC();
  const [status, setStatus] = useState<NotificationStatus>('all');

  const { data: result, isLoading, refetch } = useQuery(
    trpc.notifications.getAll.queryOptions(tripId ? { tripId } : undefined)
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
    status,
    setStatus,
    retryNotification,
    deleteNotification,
    isRetrying: retryMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getStatusBadge,
  };
}
