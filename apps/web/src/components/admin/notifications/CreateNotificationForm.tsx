/**
 * CreateNotificationForm Component
 *
 * Form for creating a new notification with validation and target filtering.
 * Supports selecting target users and/or groups for delivery using button-based selection.
 * Uses react-hook-form with Zod schema validation.
 *
 * @module @/components/admin/notifications/CreateNotificationForm
 */

'use client'

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { YStack, XStack, Text, Button, Input } from '@mirai-app/ui'
import { Check, Users, UserCircle, ChevronLeft, ChevronRight } from '@/components/ui/Icon'
import { createNotificationSchema, type CreateNotificationSchema } from './types'
import type { CreateNotificationInput } from './types'

// Target filter options
interface TargetUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface TargetGroup {
  id: string
  name: string
  memberCount: number
}

interface CreateNotificationFormProps {
  /** Callback when form is submitted successfully */
  onSubmit: (data: CreateNotificationInput) => Promise<void>
  /** Callback when cancel button is clicked */
  onCancel: () => void
  /** Whether the form is currently submitting */
  loading?: boolean
  /** Optional error message to display */
  error?: string | null
  /** Available target users for selection */
  targetUsers?: TargetUser[]
  /** Available target groups for selection */
  targetGroups?: TargetGroup[]
  /** Loading state for targets data */
  targetsLoading?: boolean
}

/**
 * CreateNotificationForm - Form for creating a new notification
 *
 * Features:
 * - Title and message fields
 * - Optional URL for deep linking
 * - Target user/group selection (empty = all)
 * - Zod validation with react-hook-form
 * - Loading state handling
 * - Error display
 * - Cancel button
 *
 * @example
 * ```tsx
 * <CreateNotificationForm
 *   onSubmit={async (data) => {
 *     await createNotification(data);
 *     navigate('/notifications');
 *   }}
 *   onCancel={() => navigate('/notifications')}
 *   loading={isCreating}
 *   error={createError?.message}
 *   targetUsers={users}
 *   targetGroups={groups}
 * />
 * ```
 */
export function CreateNotificationForm({
  onSubmit,
  onCancel,
  loading,
  error,
  targetUsers = [],
  targetGroups = [],
  targetsLoading = false,
}: CreateNotificationFormProps) {
  const [expandedSection, setExpandedSection] = useState<'users' | 'groups' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<CreateNotificationSchema>({
    resolver: zodResolver(createNotificationSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      message: '',
      url: '',
      targetUserIds: [],
      targetGroupIds: [],
    },
  })

  // Watch selected targets
  const selectedUserIds = watch('targetUserIds') ?? []
  const selectedGroupIds = watch('targetGroupIds') ?? []

  const handleFormSubmit = useCallback(
    async (data: CreateNotificationSchema) => {
      await onSubmit({
        title: data.title.trim(),
        message: data.message.trim(),
        url: data.url?.trim() || null,
        targetUserIds: data.targetUserIds?.length ? data.targetUserIds : undefined,
        targetGroupIds: data.targetGroupIds?.length ? data.targetGroupIds : undefined,
      })
    },
    [onSubmit]
  )

  const handleCancel = useCallback(() => {
    reset()
    onCancel()
  }, [reset, onCancel])

  // Toggle user selection
  const toggleUser = useCallback((userId: string) => {
    const current = selectedUserIds
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]
    setValue('targetUserIds', updated, { shouldDirty: true, shouldValidate: true })
  }, [selectedUserIds, setValue])

  // Toggle group selection
  const toggleGroup = useCallback((groupId: string) => {
    const current = selectedGroupIds
    const updated = current.includes(groupId)
      ? current.filter(id => id !== groupId)
      : [...current, groupId]
    setValue('targetGroupIds', updated, { shouldDirty: true, shouldValidate: true })
  }, [selectedGroupIds, setValue])

  // Select/deselect all users
  const toggleAllUsers = useCallback(() => {
    const allIds = targetUsers.map(u => u.id)
    const allSelected = selectedUserIds.length === targetUsers.length && targetUsers.length > 0
    setValue('targetUserIds', allSelected ? [] : allIds, { shouldDirty: true })
  }, [targetUsers, selectedUserIds.length, setValue])

  // Select/deselect all groups
  const toggleAllGroups = useCallback(() => {
    const allIds = targetGroups.map(g => g.id)
    const allSelected = selectedGroupIds.length === targetGroups.length && targetGroups.length > 0
    setValue('targetGroupIds', allSelected ? [] : allIds, { shouldDirty: true })
  }, [targetGroups, selectedGroupIds.length, setValue])

  const isSubmitDisabled = !isValid || !isDirty || loading || targetsLoading

  // Target summary text
  const getTargetSummary = () => {
    if (selectedUserIds.length === 0 && selectedGroupIds.length === 0) {
      return 'All users in trip'
    }
    const parts: string[] = []
    if (selectedUserIds.length > 0) {
      parts.push(`${selectedUserIds.length} user${selectedUserIds.length === 1 ? '' : 's'}`)
    }
    if (selectedGroupIds.length > 0) {
      parts.push(`${selectedGroupIds.length} group${selectedGroupIds.length === 1 ? '' : 's'}`)
    }
    return parts.join(', ')
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <YStack gap="$4" maxWidth={700}>
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
            label="Title"
            placeholder="Enter notification title"
            {...register('title')}
            error={errors.title?.message}
            disabled={loading}
          />
        </YStack>

        {/* Message field */}
        <YStack gap="$2">
          <Input
            label="Message"
            placeholder="Enter notification message"
            multiline
            numberOfLines={4}
            {...register('message')}
            error={errors.message?.message}
            disabled={loading}
            style={{ minHeight: 100 }}
          />
          <Text fontSize="$2" color="$colorMuted">
            Maximum 1000 characters
          </Text>
        </YStack>

        {/* URL field */}
        <YStack gap="$2">
          <Input
            label="Deep Link URL (Optional)"
            placeholder="https://example.com/page"
            {...register('url')}
            error={errors.url?.message}
            disabled={loading}
          />
          <Text fontSize="$2" color="$colorMuted">
            URL will open when users tap the notification
          </Text>
        </YStack>

        {/* Target selection summary */}
        <YStack
          padding="$3"
          backgroundColor="rgba(59, 130, 246, 0.05)"
          borderRadius="$2"
          borderWidth={1}
          borderColor="rgba(59, 130, 246, 0.2)"
        >
          <Text fontSize="$3" fontWeight="600" color="rgba(59, 130, 246, 1)">
            Target Recipients
          </Text>
          <Text fontSize="$3" color="$color">
            {getTargetSummary()}
          </Text>
          <Text fontSize="$2" color="$colorMuted" marginTop="$1">
            Leave empty to send to all users in the trip
          </Text>
        </YStack>

        {/* Target users section */}
        {targetUsers.length > 0 && (
          <YStack gap="$2">
            <Button
              variant="secondary"
              size="md"
              onPress={() => setExpandedSection(expandedSection === 'users' ? null : 'users')}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" gap="$2">
                  <UserCircle size={18} />
                  <Text>
                    Target Users ({selectedUserIds.length}/{targetUsers.length})
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$1">
                  <Text color="$colorMuted">
                    {expandedSection === 'users' ? 'Hide' : 'Show'}
                  </Text>
                  {expandedSection === 'users' ? <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} /> : <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />}
                </XStack>
              </XStack>
            </Button>

            {expandedSection === 'users' && (
              <YStack
                gap="$2"
                padding="$3"
                backgroundColor="rgba(0, 0, 0, 0.02)"
                borderRadius="$2"
              >
                {/* Select all button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={toggleAllUsers}
                  alignSelf="flex-start"
                >
                  <Text fontSize="$3" fontWeight="500" color="rgba(59, 130, 246, 1)">
                    {selectedUserIds.length === targetUsers.length && targetUsers.length > 0
                      ? 'Deselect All'
                      : 'Select All Users'}
                  </Text>
                </Button>

                {/* User list */}
                <YStack gap="$1" maxHeight={300} overflow="scroll">
                  {targetUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id)
                    return (
                      <Button
                        key={user.id}
                        variant={isSelected ? 'primary' : 'ghost'}
                        size="sm"
                        onPress={() => toggleUser(user.id)}
                        justifyContent="flex-start"
                      >
                        <XStack alignItems="center" gap="$2" width="100%">
                          <YStack
                            width={20}
                            height={20}
                            borderRadius={4}
                            backgroundColor={isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(59, 130, 246, 0.1)'}
                            alignItems="center"
                            justifyContent="center"
                          >
                            {isSelected && <Check size={14} color={isSelected ? '#fff' : '#3b82f6'} />}
                          </YStack>
                          <YStack flex={1}>
                            <Text fontSize="$3" color={isSelected ? '$color' : '$color'}>
                              {user.firstName} {user.lastName}
                            </Text>
                            <Text fontSize="$2" color="$colorMuted">
                              {user.email}
                            </Text>
                          </YStack>
                        </XStack>
                      </Button>
                    )
                  })}
                </YStack>
              </YStack>
            )}
          </YStack>
        )}

        {/* Target groups section */}
        {targetGroups.length > 0 && (
          <YStack gap="$2">
            <Button
              variant="secondary"
              size="md"
              onPress={() => setExpandedSection(expandedSection === 'groups' ? null : 'groups')}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" gap="$2">
                  <Users size={18} />
                  <Text>
                    Target Groups ({selectedGroupIds.length}/{targetGroups.length})
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$1">
                  <Text color="$colorMuted">
                    {expandedSection === 'groups' ? 'Hide' : 'Show'}
                  </Text>
                  {expandedSection === 'groups' ? <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} /> : <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />}
                </XStack>
              </XStack>
            </Button>

            {expandedSection === 'groups' && (
              <YStack
                gap="$2"
                padding="$3"
                backgroundColor="rgba(0, 0, 0, 0.02)"
                borderRadius="$2"
              >
                {/* Select all button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={toggleAllGroups}
                  alignSelf="flex-start"
                >
                  <Text fontSize="$3" fontWeight="500" color="rgba(59, 130, 246, 1)">
                    {selectedGroupIds.length === targetGroups.length && targetGroups.length > 0
                      ? 'Deselect All'
                      : 'Select All Groups'}
                  </Text>
                </Button>

                {/* Group list */}
                <YStack gap="$1" maxHeight={300} overflow="scroll">
                  {targetGroups.map((group) => {
                    const isSelected = selectedGroupIds.includes(group.id)
                    return (
                      <Button
                        key={group.id}
                        variant={isSelected ? 'primary' : 'ghost'}
                        size="sm"
                        onPress={() => toggleGroup(group.id)}
                        justifyContent="flex-start"
                      >
                        <XStack alignItems="center" gap="$2" width="100%">
                          <YStack
                            width={20}
                            height={20}
                            borderRadius={4}
                            backgroundColor={isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(59, 130, 246, 0.1)'}
                            alignItems="center"
                            justifyContent="center"
                          >
                            {isSelected && <Check size={14} color={isSelected ? '#fff' : '#3b82f6'} />}
                          </YStack>
                          <YStack flex={1}>
                            <Text fontSize="$3" color={isSelected ? '$color' : '$color'}>
                              {group.name}
                            </Text>
                            <Text fontSize="$2" color="$colorMuted">
                              {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
                            </Text>
                          </YStack>
                        </XStack>
                      </Button>
                    )
                  })}
                </YStack>
              </YStack>
            )}
          </YStack>
        )}

        {/* Targets loading state */}
        {targetsLoading && (
          <Text fontSize="$3" color="$colorMuted">
            Loading target options...
          </Text>
        )}

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
            Send Notification
          </Button>
        </XStack>
      </YStack>
    </form>
  )
}
