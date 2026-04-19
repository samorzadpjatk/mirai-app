/**
 * SchedulesPageContent Component
 *
 * Displays the schedule timeline for the selected trip.
 * Features:
 * - Fetches activities via GraphQL query
 * - Displays activities in a timeline grouped by day
 * - Supports navigation to create/edit pages
 * - Handles loading and error states
 * - Delete confirmation with cache invalidation
 * - Schedule reordering UI
 *
 * @module @/components/admin/schedules/SchedulesPageContent
 */

'use client'

import { useCallback, useState, useMemo } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
} from '@mirai-app/ui'
import { Plus, AlertCircle, Calendar, ChevronUp, ChevronDown } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { toast } from 'react-hot-toast'
import {
  useGetActivitiesQuery,
  useDeleteActivityMutation,
  useReorderActivitiesMutation,
} from '../activity/hooks'
import { ActivityCard, ActivityCardSkeleton } from '../activity/ActivityCard'
import type { Activity, ScheduleDay } from '../activity/types'
import { groupActivitiesByDay, formatDate } from '../activity/types'

/**
 * SchedulesPageContent - Main content for the schedules timeline page
 *
 * Fetches activities for the selected trip and displays them in a timeline.
 * Supports creating, editing, and deleting activities.
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'schedules': () => import('../admin/schedules/SchedulesPageContent'),
 * ```
 */
export function SchedulesPageContent() {
  const { selectedTrip } = useTripContext()
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null)
  const [reorderingActivity, setReorderingActivity] = useState<Activity | null>(null)

  // Get trip ID as string for the query
  const tripIdString = selectedTrip ? TripId.toString(selectedTrip.id) : ''

  // Fetch activities
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    refetch,
  } = useGetActivitiesQuery(tripIdString)

  // Delete mutation
  const {
    deleteActivity,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteActivityMutation()

  // Reorder mutation
  const {
    reorderActivities,
    loading: reorderLoading,
    error: reorderError,
  } = useReorderActivitiesMutation()

  // Group activities by day for timeline
  const scheduleDays: ScheduleDay[] = useMemo(() => {
    if (!selectedTrip || activities.length === 0) return []
    // Note: We need trip start date from the trip data
    // For now, using the first activity's date as reference
    const firstActivity = activities[0]
    const referenceDate: string = firstActivity
      ? (firstActivity.startTime.split('T')[0] ?? new Date().toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0]
    return groupActivitiesByDay(activities, referenceDate)
  }, [activities, selectedTrip])

  // Navigate to create activity page
  const handleCreateClick = useCallback(() => {
    window.location.href = '/schedules/new'
  }, [])

  // Navigate to edit activity page
  const handleEditClick = useCallback((activity: Activity) => {
    window.location.href = `/schedules/${activity.id}/edit`
  }, [])

  // Open delete confirmation
  const handleDeleteClick = useCallback((activity: Activity) => {
    setActivityToDelete(activity)
  }, [])

  // Close delete confirmation
  const handleCancelDelete = useCallback(() => {
    setActivityToDelete(null)
  }, [])

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!activityToDelete) return

    try {
      await deleteActivity(activityToDelete.id)
      toast.success(`Activity "${activityToDelete.title}" deleted successfully`)
      setActivityToDelete(null)
      refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete activity'
      toast.error(message)
    }
  }, [activityToDelete, deleteActivity, refetch])

  // Move activity up in order
  const handleMoveUp = useCallback(
    async (activity: Activity, dayActivities: Activity[]) => {
      const currentIndex = dayActivities.findIndex((a) => a.id === activity.id)
      if (currentIndex <= 0) return

      const prevActivity = dayActivities[currentIndex - 1]
      if (!prevActivity) return

      // Get ordered IDs for the entire trip's activities
      const allActivityIds = activities
        .sort((a, b) => {
          const dateA = new Date(a.startTime).getTime()
          const dateB = new Date(b.startTime).getTime()
          if (dateA !== dateB) return dateA - dateB
          return a.order - b.order
        })
        .map((a) => a.id)

      try {
        await reorderActivities(tripIdString, allActivityIds)
        toast.success('Activity moved up')
        refetch()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reorder activities'
        toast.error(message)
      }
    },
    [activities, tripIdString, reorderActivities, refetch]
  )

  // Move activity down in order
  const handleMoveDown = useCallback(
    async (activity: Activity, dayActivities: Activity[]) => {
      const currentIndex = dayActivities.findIndex((a) => a.id === activity.id)
      if (currentIndex >= dayActivities.length - 1) return

      // Get ordered IDs for the entire trip's activities
      const allActivityIds = activities
        .sort((a, b) => {
          const dateA = new Date(a.startTime).getTime()
          const dateB = new Date(b.startTime).getTime()
          if (dateA !== dateB) return dateA - dateB
          return a.order - b.order
        })
        .map((a) => a.id)

      try {
        await reorderActivities(tripIdString, allActivityIds)
        toast.success('Activity moved down')
        refetch()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reorder activities'
        toast.error(message)
      }
    },
    [activities, tripIdString, reorderActivities, refetch]
  )

  // Render loading state
  if (activitiesLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Schedule
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
            disabled
          >
            <Plus size={18} />
            Add Activity
          </Button>
        </XStack>
        <YStack gap="$3">
          {[...Array(5)].map((_, i) => (
            <ActivityCardSkeleton key={i} />
          ))}
        </YStack>
      </YStack>
    )
  }

  // Render error state
  if (activitiesError) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Schedule
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
          >
            <Plus size={18} />
            Add Activity
          </Button>
        </XStack>
        <ErrorMessage
          title="Failed to load schedule"
          message={activitiesError.message}
          onRetry={refetch}
        />
      </YStack>
    )
  }

  // Render empty trip state
  if (!selectedTrip) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <Calendar size={48} color="#9ca3af" />
        <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
          No trip selected
        </Text>
        <Text fontSize="$3" color="$colorMuted" textAlign="center">
          Please select a trip from the header to view the schedule
        </Text>
      </YStack>
    )
  }

  // Render empty activities state
  if (activities.length === 0) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Schedule
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
          >
            <Plus size={18} />
            Add Activity
          </Button>
        </XStack>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <Calendar size={64} color="#9ca3af" />
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            No activities yet
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            Get started by adding your first activity to {selectedTrip.name}
          </Text>
          <Button
            variant="primary"
            size="lg"
            onPress={handleCreateClick}
            marginTop="$4"
          >
            <Plus size={20} />
            Add Activity
          </Button>
        </YStack>
      </YStack>
    )
  }

  // Render schedule timeline
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
            Schedule
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'} in{' '}
            {selectedTrip.name}
          </Text>
        </YStack>
        <Button
          variant="primary"
          size="md"
          onPress={handleCreateClick}
        >
          <Plus size={18} />
          Add Activity
        </Button>
      </XStack>

      {/* Timeline by day */}
      <YStack gap="$6" overflow="scroll" flex={1}>
        {scheduleDays.map((day) => (
          <YStack key={day.date} gap="$3">
            {/* Day header */}
            <XStack
              alignItems="center"
              gap="$2"
              paddingBottom="$2"
              borderBottomWidth={1}
              borderBottomColor="rgba(0,0,0,0.1)"
            >
              <Calendar size={18} color="gray" />
              <Text fontSize="$5" fontWeight="600" color="$color">
                Day {day.dayNumber}
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                {formatDate(day.date)}
              </Text>
            </XStack>

            {/* Activities for this day */}
            <YStack gap="$2">
              {day.activities.map((activity, index) => (
                <XStack key={activity.id} alignItems="center" gap="$2">
                  {/* Reorder buttons */}
                  <YStack>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleMoveUp(activity, day.activities)}
                      disabled={index === 0 || reorderLoading}
                      padding="$1"
                    >
                      <ChevronUp size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleMoveDown(activity, day.activities)}
                      disabled={index === day.activities.length - 1 || reorderLoading}
                      padding="$1"
                    >
                      <ChevronDown size={16} />
                    </Button>
                  </YStack>

                  {/* Activity card */}
                  <YStack flex={1}>
                    <ActivityCard
                      activity={activity}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  </YStack>
                </XStack>
              ))}
            </YStack>
          </YStack>
        ))}
      </YStack>

      {/* Delete confirmation sheet */}
      <Sheet
        open={!!activityToDelete}
        onOpenChange={(open: boolean) => !open && handleCancelDelete()}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            Delete Activity
          </Text>
          <Text fontSize="$4" color="$color">
            Are you sure you want to delete{' '}
            <Text fontWeight="600">{activityToDelete?.title}</Text>?
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            This action cannot be undone. The activity will be permanently removed from the schedule.
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
