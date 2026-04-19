/**
 * EditActivityForm Component
 *
 * Form for editing an existing schedule activity with validation.
 * Uses react-hook-form with Zod schema validation.
 *
 * @module @/components/admin/activity/EditActivityForm
 */

'use client'

import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Select,
} from '@mirai-app/ui'
import {
  updateActivitySchema,
  type UpdateActivitySchema,
  type ActivityType,
  formatTime,
} from './types'
import type { Activity, UpdateActivityInput } from './types'

interface EditActivityFormProps {
  /** Activity data to pre-fill the form */
  activity: Activity
  /** Callback when form is submitted successfully */
  onSubmit: (id: string, data: UpdateActivityInput) => Promise<void>
  /** Callback when cancel button is clicked */
  onCancel: () => void
  /** Whether the form is currently submitting */
  loading?: boolean
  /** Optional error message to display */
  error?: string | null
}

const activityTypeOptions: { value: ActivityType; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'MEAL', label: 'Meal' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'CHALLENGE', label: 'Challenge' },
  { value: 'REST', label: 'Rest' },
  { value: 'CHECK_IN', label: 'Check In' },
  { value: 'CHECK_OUT', label: 'Check Out' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'FREE_TIME', label: 'Free Time' },
  { value: 'OTHER', label: 'Other' },
]

/**
 * Format datetime for input field (YYYY-MM-DDTHH:MM)
 */
function formatDateTimeForInput(dateTimeString: string): string {
  const date = new Date(dateTimeString)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

/**
 * EditActivityForm - Form for editing an existing schedule activity
 *
 * Features:
 * - Pre-filled with existing activity data
 * - Title, description, type, and time fields
 * - Zod validation with react-hook-form
 * - Loading state handling
 * - Error display
 * - Cancel button
 *
 * @example
 * ```tsx
 * <EditActivityForm
 *   activity={existingActivity}
 *   onSubmit={async (id, data) => {
 *     await updateActivity(id, data);
 *     navigate('/schedules');
 *   }}
 *   onCancel={() => navigate('/schedules')}
 *   loading={isUpdating}
 *   error={updateError?.message}
 * />
 * ```
 */
export function EditActivityForm({
  activity,
  onSubmit,
  onCancel,
  loading,
  error,
}: EditActivityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<UpdateActivitySchema>({
    resolver: zodResolver(updateActivitySchema),
    mode: 'onBlur',
    defaultValues: {
      id: activity.id,
      title: activity.title,
      description: activity.description || '',
      type: activity.type,
      startTime: formatDateTimeForInput(activity.startTime),
      endTime: activity.endTime ? formatDateTimeForInput(activity.endTime) : null,
      location: activity.location || '',
      isVisible: activity.isVisible,
    },
  })

  // Reset form when activity changes
  useEffect(() => {
    reset({
      id: activity.id,
      title: activity.title,
      description: activity.description || '',
      type: activity.type,
      startTime: formatDateTimeForInput(activity.startTime),
      endTime: activity.endTime ? formatDateTimeForInput(activity.endTime) : null,
      location: activity.location || '',
      isVisible: activity.isVisible,
    })
  }, [activity, reset])

  const selectedType = watch('type')
  const isVisible = watch('isVisible')

  const handleFormSubmit = useCallback(
    async (data: UpdateActivitySchema) => {
      const updateData: UpdateActivityInput = {
        id: activity.id,
      }

      // Only include changed fields
      if (data.title && data.title !== activity.title) {
        updateData.title = data.title.trim()
      }
      if (data.description !== (activity.description || '')) {
        updateData.description = data.description?.trim() || null
      }
      if (data.type && data.type !== activity.type) {
        updateData.type = data.type
      }
      if (data.startTime && data.startTime !== formatDateTimeForInput(activity.startTime)) {
        updateData.startTime = data.startTime
      }
      const currentEndTime = activity.endTime ? formatDateTimeForInput(activity.endTime) : null
      if (data.endTime !== currentEndTime) {
        updateData.endTime = data.endTime || null
      }
      if (data.location !== (activity.location || '')) {
        updateData.location = data.location?.trim() || null
      }
      if (data.isVisible !== activity.isVisible) {
        updateData.isVisible = data.isVisible
      }

      await onSubmit(activity.id, updateData)
    },
    [onSubmit, activity]
  )

  const handleCancel = useCallback(() => {
    reset()
    onCancel()
  }, [reset, onCancel])

  const isSubmitDisabled = !isValid || !isDirty || loading

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <YStack gap="$4" maxWidth={600}>
        {/* Error message */}
        {error && (
          <YStack
            padding="$3"
            backgroundColor="rgba(239, 68, 68, 0.1)"
            borderRadius="$2"
            borderWidth={1}
            borderColor="#ef4444"
          >
            <Text color="#ef4444" fontSize="$3">
              {error}
            </Text>
          </YStack>
        )}

        {/* Title field */}
        <YStack gap="$2">
          <Input
            label="Activity Title"
            placeholder="Enter activity title"
            {...register('title')}
            error={errors.title?.message}
            disabled={loading}
          />
        </YStack>

        {/* Type field */}
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="500" color="$color">
            Activity Type
          </Text>
          <Select
            value={selectedType}
            onValueChange={(value) => setValue('type', value as ActivityType, { shouldDirty: true })}
            placeholder="Select activity type"
          >
            {activityTypeOptions.map((option, index) => (
              <Select.Item key={option.value} value={option.value} index={index}>
                {option.label}
              </Select.Item>
            ))}
          </Select>
          {errors.type && (
            <Text fontSize="$2" color="#ef4444">
              {errors.type.message}
            </Text>
          )}
        </YStack>

        {/* Time fields */}
        <XStack gap="$3" flexWrap="wrap">
          <YStack gap="$2" flex={1} minWidth={200}>
            <Input
              label="Start Time"
              placeholder="YYYY-MM-DD HH:MM"
              {...register('startTime')}
              error={errors.startTime?.message}
              disabled={loading}
            />
          </YStack>
          <YStack gap="$2" flex={1} minWidth={200}>
            <Input
              label="End Time (Optional)"
              placeholder="YYYY-MM-DD HH:MM"
              {...register('endTime')}
              error={errors.endTime?.message}
              disabled={loading}
            />
          </YStack>
        </XStack>

        {/* Location field */}
        <YStack gap="$2">
          <Input
            label="Location (Optional)"
            placeholder="Enter location"
            {...register('location')}
            error={errors.location?.message}
            disabled={loading}
          />
        </YStack>

        {/* Description field */}
        <YStack gap="$2">
          <Input
            label="Description (Optional)"
            placeholder="Enter activity description"
            {...register('description')}
            error={errors.description?.message}
            disabled={loading}
          />
        </YStack>

        {/* Visibility toggle using button */}
        <XStack alignItems="center" gap="$2">
          <Button
            variant={isVisible ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setValue('isVisible', !isVisible, { shouldDirty: true })}
            disabled={loading}
          >
            {isVisible ? 'Visible to participants' : 'Hidden from participants'}
          </Button>
        </XStack>

        {/* Action buttons */}
        <XStack gap="$3" marginTop="$4">
          <Button
            variant="secondary"
            size="lg"
            onPress={handleCancel}
            disabled={loading}
            flex={1}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit(handleFormSubmit)}
            disabled={isSubmitDisabled}
            isLoading={loading}
            flex={1}
          >
            Update Activity
          </Button>
        </XStack>
      </YStack>
    </form>
  )
}
