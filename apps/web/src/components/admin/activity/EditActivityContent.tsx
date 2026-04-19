/**
 * EditActivityContent Component
 *
 * Page wrapper for editing an existing schedule activity.
 * Handles form submission, data fetching, and navigation.
 *
 * @module @/components/admin/activity/EditActivityContent
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { YStack, Text } from '@mirai-app/ui'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EditActivityForm } from './EditActivityForm'
import { useGetActivityQuery, useUpdateActivityMutation } from './hooks'
import type { UpdateActivityInput } from './types'

interface EditActivityContentProps {
  /** The ID of the activity to edit */
  activityId: string
}

/**
 * EditActivityContent - Page content for editing an activity
 *
 * Wraps the EditActivityForm with page-level logic including
 * data fetching, form submission, and navigation.
 *
 * @example
 * ```tsx
 * // In a Next.js page
 * export default function EditActivityPage({ params }: { params: { id: string } }) {
 *   return <EditActivityContent activityId={params.id} />;
 * }
 * ```
 */
export function EditActivityContent({ activityId }: EditActivityContentProps) {
  const { activity, loading: fetchLoading, error: fetchError } = useGetActivityQuery(activityId)
  const { updateActivity, loading: updateLoading, error: updateError } = useUpdateActivityMutation()

  const handleSubmit = useCallback(
    async (id: string, input: UpdateActivityInput) => {
      try {
        await updateActivity(id, input)
        toast.success('Activity updated successfully')
        // Navigate back to schedules page
        window.location.href = '/schedules'
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update activity'
        toast.error(message)
        throw err
      }
    },
    [updateActivity]
  )

  const handleCancel = useCallback(() => {
    window.location.href = '/schedules'
  }, [])

  // Loading state
  if (fetchLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <LoadingSpinner />
        <Text fontSize="$3" color="$colorMuted">
          Loading activity...
        </Text>
      </YStack>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <YStack flex={1} gap="$4">
        <Text fontSize="$6" fontWeight="600">
          Edit Activity
        </Text>
        <ErrorMessage
          title="Failed to load activity"
          message={fetchError.message}
          onRetry={() => window.location.reload()}
        />
      </YStack>
    )
  }

  // Not found state
  if (!activity) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <Text fontSize="$5" fontWeight="500" color="$colorMuted">
          Activity not found
        </Text>
        <Text fontSize="$3" color="$colorMuted" textAlign="center">
          The activity you're looking for doesn't exist or has been deleted.
        </Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} gap="$4">
      <Text fontSize="$6" fontWeight="600">
        Edit Activity
      </Text>
      <Text fontSize="$3" color="$colorMuted" marginBottom="$4">
        Update "{activity.title}"
      </Text>

      <EditActivityForm
        activity={activity}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={updateLoading}
        error={updateError?.message}
      />
    </YStack>
  )
}
