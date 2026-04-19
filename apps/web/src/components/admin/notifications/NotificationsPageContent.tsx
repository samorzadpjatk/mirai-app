/**
 * NotificationsPageContent Component
 *
 * Displays the list of notifications for the selected trip with real-time
 * delivery via GraphQL subscriptions.
 * Features:
 * - Fetches notifications via GraphQL query
 * - Real-time updates via subscription
 * - Displays notifications in a card list
 * - Supports creating new notifications
 * - Handles loading and error states
 * - Delete confirmation with cache invalidation
 *
 * @module @/components/admin/notifications/NotificationsPageContent
 */

'use client'

import { useCallback, useState, useEffect } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
} from '@mirai-app/ui'
import { Plus, AlertCircle, Bell } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { toast } from 'react-hot-toast'
import {
  useGetNotificationsQuery,
  useDeleteNotificationMutation,
  useNotificationReceivedSubscription,
} from './hooks'
import { NotificationCard, NotificationCardSkeleton } from './NotificationCard'
import type { Notification } from './types'

/**
 * NotificationsPageContent - Main content for the notifications list page
 *
 * Fetches notifications for the selected trip with real-time updates.
 * Supports creating and deleting notifications.
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'notifications': () => import('../admin/notifications/NotificationsPageContent'),
 * ```
 */
export function NotificationsPageContent() {
  const { selectedTrip } = useTripContext()
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null)

  // Get trip ID as string for the query
  const tripIdString = selectedTrip ? TripId.toString(selectedTrip.id) : ''

  // Fetch notifications
  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
    refetch,
    hasMore,
    loadMore,
  } = useGetNotificationsQuery(tripIdString)

  // Subscribe to real-time notifications
  const { latestNotification } = useNotificationReceivedSubscription()

  // Delete mutation
  const {
    deleteNotification,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteNotificationMutation()

  // Handle real-time notification updates
  useEffect(() => {
    if (latestNotification && selectedTrip) {
      // Check if the notification is for the current trip
      const currentTripId = TripId.toString(selectedTrip.id)
      if (latestNotification.tripId === currentTripId) {
        toast.success(`New notification: ${latestNotification.title}`, {
          icon: '🔔',
        })
        // Refetch to show the new notification
        refetch()
      }
    }
  }, [latestNotification, selectedTrip, refetch])

  // Navigate to create notification page
  const handleCreateClick = useCallback(() => {
    window.location.href = '/notifications/new'
  }, [])

  // Open delete confirmation
  const handleDeleteClick = useCallback((notification: Notification) => {
    setNotificationToDelete(notification)
  }, [])

  // Close delete confirmation
  const handleCancelDelete = useCallback(() => {
    setNotificationToDelete(null)
  }, [])

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!notificationToDelete) return

    try {
      await deleteNotification(notificationToDelete.id)
      toast.success(`Notification "${notificationToDelete.title}" deleted successfully`)
      setNotificationToDelete(null)
      refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification'
      toast.error(message)
    }
  }, [notificationToDelete, deleteNotification, refetch])

  // Render loading state
  if (notificationsLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Notifications
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
            disabled
          >
            <Plus size={18} />
            Send Notification
          </Button>
        </XStack>
        <YStack gap="$3">
          {[...Array(5)].map((_, i) => (
            <NotificationCardSkeleton key={i} />
          ))}
        </YStack>
      </YStack>
    )
  }

  // Render error state
  if (notificationsError) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Notifications
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
          >
            <Plus size={18} />
            Send Notification
          </Button>
        </XStack>
        <ErrorMessage
          title="Failed to load notifications"
          message={notificationsError.message}
          onRetry={refetch}
        />
      </YStack>
    )
  }

  // Render empty trip state
  if (!selectedTrip) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <AlertCircle size={48} color="#9ca3af" />
        <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
          No trip selected
        </Text>
        <Text fontSize="$3" color="$colorMuted" textAlign="center">
          Please select a trip from the header to view notifications
        </Text>
      </YStack>
    )
  }

  // Render empty notifications state
  if (notifications.length === 0) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Notifications
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
          >
            <Plus size={18} />
            Send Notification
          </Button>
        </XStack>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <Bell size={48} color="#9ca3af" />
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            No notifications yet
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            Get started by sending your first notification to {selectedTrip.name}
          </Text>
          <Button variant="primary" size="lg" onPress={handleCreateClick} marginTop="$4">
            <Plus size={20} />
            Send Notification
          </Button>
        </YStack>
      </YStack>
    )
  }

  // Render notifications list
  return (
    <YStack flex={1}>
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$4"
        flexWrap="wrap"
        gap="$2"
      >
        <YStack>
          <Text fontSize="$6" fontWeight="600">
            Notifications
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'} in {selectedTrip.name}
          </Text>
        </YStack>
        <Button
          variant="primary"
          size="md"
          onPress={handleCreateClick}
        >
          <Plus size={18} />
          Send Notification
        </Button>
      </XStack>

      {/* Notifications list */}
      <YStack gap="$3">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDelete={handleDeleteClick}
          />
        ))}
      </YStack>

      {/* Load more button */}
      {hasMore && (
        <Button
          variant="secondary"
          size="md"
          onPress={loadMore}
          marginTop="$4"
          alignSelf="center"
        >
          Load More
        </Button>
      )}

      {/* Delete confirmation sheet */}
      <Sheet
        open={!!notificationToDelete}
        onOpenChange={(open: boolean) => !open && handleCancelDelete()}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            Delete Notification
          </Text>
          <Text fontSize="$4" color="$color">
            Are you sure you want to delete{' '}
            <Text fontWeight="600">
              {notificationToDelete?.title}
            </Text>
            ?
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            This action cannot be undone. The notification will be permanently removed.
          </Text>

          {deleteError && (
            <YStack
              padding="$3"
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderRadius="$2"
              borderWidth={1}
              borderColor="#ef4444"
            >
              <Text color="#ef4444" fontSize="$3">
                {deleteError.message}
              </Text>
            </YStack>
          )}

          <XStack gap="$3" marginTop="$2">
            <Button
              variant="secondary"
              size="lg"
              onPress={handleCancelDelete}
              disabled={deleteLoading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="lg"
              onPress={handleConfirmDelete}
              disabled={deleteLoading}
              isLoading={deleteLoading}
              flex={1}
            >
              Delete
            </Button>
          </XStack>
        </YStack>
      </Sheet>
    </YStack>
  )
}
