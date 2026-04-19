/**
 * CreateActivityForm Component
 *
 * Form for creating a new schedule activity with validation.
 * Uses react-hook-form with Zod schema validation.
 *
 * @module @/components/admin/activity/CreateActivityForm
 */

'use client'

import { useCallback } from 'react'
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
import { createActivitySchema, type CreateActivitySchema, type ActivityType } from './types'
import type { CreateActivityInput } from './types'

interface CreateActivityFormProps {
  /** Callback when form is submitted successfully */
  onSubmit: (data: CreateActivityInput) => Promise<void>
  /** Callback when cancel button is clicked */
  onCancel: () => void
  /** Whether the form is currently submitting */
  loading?: boolean
  /** Optional error message to display */
  error?: string | null
  /** The trip ID to associate with the activity */
  tripId: string
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
 * CreateActivityForm - Form for creating a new schedule activity
 *
 * Features:
 * - Title, description, type, and time fields
 * - Zod validation with react-hook-form
 * - Loading state handling
 * - Error display
 * - Cancel button
 *
 * @example
 * ```tsx
 * <CreateActivityForm
 *   onSubmit={async (data) => {
 *     await createActivity(data);
 *     navigate('/schedules');
 *   }}
 *   onCancel={() => navigate('/schedules')}
 *   loading={isCreating}
 *   error={createError?.message}
 *   tripId={selectedTrip.id}
 * />
 * ```
 */
export function CreateActivityForm({
  onSubmit,
  onCancel,
  loading,
  error,
  tripId,
}: CreateActivityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<CreateActivitySchema>({
    resolver: zodResolver(createActivitySchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      type: 'GENERAL',
      startTime: '',
      endTime: null,
      location: '',
      isVisible: true,
    },
  })

  const selectedType = watch('type')
  const isVisible = watch('isVisible')

  const handleFormSubmit = useCallback(
    async (data: CreateActivitySchema) => {
      await onSubmit({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        tripId,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime || null,
        location: data.location?.trim() || null,
        isVisible: data.isVisible ?? true,
      })
    },
    [onSubmit, tripId]
  )

  const handleCancel = useCallback(() => {
    reset()
    onCancel()
  }, [reset, onCancel])

  const isSubmitDisabled = !isValid || !isDirty || loading

  // Helper to format datetime-local input value
  const getCurrentDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

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
              defaultValue={getCurrentDateTime()}
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
            Create Activity
          </Button>
        </XStack>
      </YStack>
    </form>
  )
}
