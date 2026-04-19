'use client'

import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { YStack, XStack, Text, Button, Input, InputLabel } from '@mirai-app/ui'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  useGetGroupQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} from './hooks'
import { updateGroupSchema, type UpdateGroupSchema } from './types'
import { useState } from 'react'

interface EditGroupFormProps {
  groupId: string
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * EditGroupForm - Form component for editing a group
 *
 * Provides form fields for editing group name with validation
 * using react-hook-form and Zod. Includes delete functionality.
 *
 * @example
 * ```tsx
 * <EditGroupForm
 *   groupId="group-123"
 *   onSuccess={() => console.log('Group updated')}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export function EditGroupForm({ groupId, onSuccess, onCancel }: EditGroupFormProps) {
  const { selectedTrip } = useTripContext()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch group data
  const { group, loading: groupLoading, error: groupError } = useGetGroupQuery(groupId)

  // Mutations
  const { updateGroup, loading: updateLoading, error: updateError } = useUpdateGroupMutation()
  const { deleteGroup, loading: deleteLoading, error: deleteError } = useDeleteGroupMutation()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<UpdateGroupSchema>({
    resolver: zodResolver(updateGroupSchema),
    mode: 'onBlur',
    defaultValues: {
      id: groupId,
      name: '',
    },
  })

  // Watch form values to detect changes
  const watchedName = watch('name') ?? ''

  // Initialize form data when group loads
  useEffect(() => {
    if (group) {
      setValue('id', group.id)
      setValue('name', group.name)
    }
  }, [group, setValue])

  // Check if name has changed
  const hasChanges = group && watchedName.trim() !== group.name

  const handleFormSubmit = useCallback(
    async (data: UpdateGroupSchema) => {
      if (!group) return

      const input = {
        name: data.name?.trim() ?? group.name,
      }

      await updateGroup(group.id, input)

      if (onSuccess) {
        onSuccess()
      }
    },
    [group, updateGroup, onSuccess]
  )

  const handleDelete = useCallback(async () => {
    if (!group) return

    await deleteGroup(group.id)

    if (onSuccess) {
      onSuccess()
    }
  }, [group, deleteGroup, onSuccess])

  const handleCancel = useCallback(() => {
    reset()
    if (onCancel) {
      onCancel()
    }
  }, [reset, onCancel])

  const isLoading = groupLoading
  const isSaving = updateLoading || deleteLoading
  const error = groupError || updateError || deleteError

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner label="Loading group data..." />
  }

  // Show error state
  if (groupError || !group) {
    return (
      <YStack gap="$4" padding="$4">
        <ErrorMessage message={groupError?.message || 'Group not found'} />
        <Button onPress={handleCancel} variant="secondary">
          Go Back
        </Button>
      </YStack>
    )
  }

  const isSubmitDisabled = !hasChanges || !isValid || isSaving

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
          Edit Group
        </Text>
      </XStack>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <YStack gap="$4">
          {/* Group Info Card */}
          <YStack
            backgroundColor="$backgroundHover"
            padding="$4"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            gap="$2"
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$2" color="$colorMuted">
                Group ID
              </Text>
              <Text fontSize="$3" fontWeight="600">
                {group.id}
              </Text>
            </XStack>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$2" color="$colorMuted">
                Coins
              </Text>
              <Text fontSize="$3" fontWeight="600">
                {group.coins}
              </Text>
            </XStack>
          </YStack>

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
                {error.message}
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
              disabled={isSaving}
            />
          </YStack>

          {/* Action buttons */}
          <XStack gap="$3" justifyContent="space-between">
            <Button
              variant="danger"
              onPress={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
              leftIcon={<Trash2 size={18} />}
            >
              Delete
            </Button>
            <XStack gap="$3">
              <Button
                variant="secondary"
                onPress={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit(handleFormSubmit)}
                disabled={isSubmitDisabled}
                isLoading={updateLoading}
                leftIcon={<Save size={18} />}
              >
                Save Changes
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <YStack
            backgroundColor="$background"
            padding="$6"
            borderRadius="$4"
            maxWidth={400}
            width="90%"
            gap="$4"
          >
            <Text fontSize="$6" fontWeight="700">
              Delete Group
            </Text>
            <Text fontSize="$3" color="$colorMuted">
              Are you sure you want to delete &quot;{group.name}&quot;? This action cannot be undone.
            </Text>
            <XStack gap="$3" justifyContent="flex-end">
              <Button
                variant="secondary"
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </XStack>
          </YStack>
        </YStack>
      )}
    </YStack>
  )
}
