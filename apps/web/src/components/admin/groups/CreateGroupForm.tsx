'use client'

import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { YStack, XStack, Text, Button, Input, InputLabel } from '@mirai-app/ui'
import { Plus, ArrowLeft } from 'lucide-react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import { useCreateGroupMutation } from './hooks'
import { createGroupSchema, type CreateGroupSchema, type CreateGroupInput } from './types'

interface CreateGroupFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * CreateGroupForm - Form component for creating a new group
 *
 * Provides form fields for group name with validation using
 * react-hook-form and Zod. Requires trip context to be available.
 *
 * @example
 * ```tsx
 * <CreateGroupForm
 *   onSuccess={() => console.log('Group created')}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export function CreateGroupForm({ onSuccess, onCancel }: CreateGroupFormProps) {
  const { selectedTrip } = useTripContext()
  const { createGroup, loading, error: mutationError } = useCreateGroupMutation()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<CreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
    },
  })

  const tripId = selectedTrip ? TripId.toString(selectedTrip.id) : null

  const handleFormSubmit = useCallback(
    async (data: CreateGroupSchema) => {
      if (!tripId) {
        return
      }

      const input: CreateGroupInput = {
        name: data.name.trim(),
        tripId,
      }

      await createGroup(input)

      if (onSuccess) {
        onSuccess()
      }
    },
    [tripId, createGroup, onSuccess]
  )

  const handleCancel = useCallback(() => {
    reset()
    if (onCancel) {
      onCancel()
    }
  }, [reset, onCancel])

  const isSubmitDisabled = !isValid || !isDirty || loading || !tripId

  // Show no trip selected state
  if (!selectedTrip) {
    return (
      <YStack gap="$4" padding="$4" alignItems="center">
        <Text color="$colorMuted">Please select a trip to create a group</Text>
        <Button onPress={handleCancel} variant="secondary">
          Go Back
        </Button>
      </YStack>
    )
  }

  return (
    <YStack gap="$4" maxWidth={600}>
      {/* Header */}
      <XStack alignItems="center" gap="$2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={18} />}
          onPress={handleCancel}
        >
          Back
        </Button>
        <Text fontSize="$6" fontWeight="700">
          Create Group
        </Text>
      </XStack>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <YStack gap="$4">
          {/* Trip context info */}
          <YStack
            backgroundColor="$backgroundHover"
            padding="$3"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Text fontSize="$2" color="$colorMuted">
              Creating group for trip:
            </Text>
            <Text fontSize="$4" fontWeight="600">
              {selectedTrip.name}
            </Text>
          </YStack>

          {/* Error message */}
          {mutationError && (
            <YStack
              padding="$3"
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderRadius="$2"
              borderWidth={1}
              borderColor="#ef4444"
            >
              <Text color="#ef4444" fontSize="$3">
                {mutationError.message}
              </Text>
            </YStack>
          )}

          {/* Group Name */}
          <YStack gap="$2">
            <InputLabel htmlFor="group-name">
              <Text fontSize="$3" fontWeight="500">
                Group Name *
              </Text>
            </InputLabel>
            <Input
              id="group-name"
              placeholder="Enter group name..."
              {...register('name')}
              error={errors.name?.message}
              disabled={loading}
            />
          </YStack>

          {/* Action buttons */}
          <XStack gap="$3" justifyContent="flex-end">
            <Button
              variant="secondary"
              onPress={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit(handleFormSubmit)}
              disabled={isSubmitDisabled}
              isLoading={loading}
              leftIcon={<Plus size={18} />}
            >
              Create Group
            </Button>
          </XStack>
        </YStack>
      </form>
    </YStack>
  )
}
