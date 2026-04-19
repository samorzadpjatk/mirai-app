/**
 * CreateRewardContent Component
 *
 * Page wrapper for creating a new reward.
 * Provides the layout and handles the create mutation with file upload.
 *
 * @module @/components/admin/rewards/CreateRewardContent
 */

'use client'

import { useCallback, useState } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import { YStack, Text, Button, XStack } from '@mirai-app/ui'
import { ChevronLeft } from '@/components/ui/Icon'
import { toast } from 'react-hot-toast'
import { useCreateRewardMutation, useGetUploadUrl } from './hooks'
import { CreateRewardForm } from './CreateRewardForm'
import type { CreateRewardInput, FileUploadResult } from './types'

/**
 * CreateRewardContent - Page content for creating a new reward
 *
 * Features:
 * - Displays create reward form with file upload
 * - Handles create mutation with trip context
 * - Integrates with storage service for image uploads
 * - Shows success/error feedback via toast
 * - Navigation back to rewards list
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'rewards-new': () => import('../admin/rewards/CreateRewardContent'),
 * ```
 */
export function CreateRewardContent() {
  const { selectedTrip } = useTripContext()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    createReward,
    loading,
    error: mutationError,
  } = useCreateRewardMutation()

  const {
    getUploadUrl,
    loading: uploadLoading,
  } = useGetUploadUrl()

  // Navigate back to rewards list
  const handleCancel = useCallback(() => {
    window.location.href = '/rewards'
  }, [])

  // Handle file upload using storage service
  const handleUploadFile = useCallback(
    async (file: File): Promise<FileUploadResult> => {
      // Get upload URL from GraphQL
      const uploadUrl = await getUploadUrl({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      })

      // Upload file to the returned URL
      const response = await fetch(uploadUrl.url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const publicUrl = uploadUrl.url?.split('?')[0] ?? ''

      return {
        url: publicUrl,
        path: uploadUrl.path,
      }
    },
    [getUploadUrl]
  )

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: CreateRewardInput) => {
      if (!selectedTrip) {
        setSubmitError('No trip selected. Please select a trip first.')
        return
      }

      setSubmitError(null)

      try {
        const tripIdStr = TripId.toString(selectedTrip.id)
        if (!tripIdStr) {
          setSubmitError('Invalid trip ID')
          return
        }
        
        // Create reward with trip context
        await createReward({
          ...data,
          tripId: tripIdStr,
        })

        // Show success message
        toast.success(`Reward "${data.name}" created successfully`)

        // Navigate back to rewards list
        window.location.href = '/rewards'
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create reward'
        setSubmitError(message)
        toast.error(message)
      }
    },
    [selectedTrip, createReward]
  )

  // Combine mutation error with submit error
  const error = submitError || (mutationError?.message ?? null)

  // Render no trip selected state
  if (!selectedTrip) {
    return (
      <YStack flex={1} gap="$4">
        <Button
          variant="ghost"
          size="md"
          onPress={handleCancel}
          alignSelf="flex-start"
        >
          <ChevronLeft size={18} />
          Back to Rewards
        </Button>

        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            No trip selected
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            Please select a trip from the header before creating a reward
          </Text>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack flex={1} gap="$4">
      {/* Header */}
      <XStack alignItems="center" gap="$2">
        <Button
          variant="ghost"
          size="md"
          onPress={handleCancel}
        >
          <ChevronLeft size={18} />
        </Button>
        <YStack>
          <Text fontSize="$6" fontWeight="600">
            Create Reward
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            Adding to {selectedTrip.name}
          </Text>
        </YStack>
      </XStack>

      {/* Form */}
      <CreateRewardForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error}
        onUploadFile={handleUploadFile}
      />
    </YStack>
  )
}
