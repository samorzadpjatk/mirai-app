/**
 * EditRewardContent Component
 *
 * Page wrapper for editing an existing reward.
 * Fetches reward data and provides the edit form with file upload.
 *
 * @module @/components/admin/rewards/EditRewardContent
 */

'use client'

import { useCallback, useState, useEffect } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import { YStack, Text, Button, XStack } from '@mirai-app/ui'
import { ChevronLeft, AlertCircle } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { toast } from 'react-hot-toast'
import { useGetRewardQuery, useGetUploadUrl } from './hooks'
import { EditRewardForm } from './EditRewardForm'
import type { Reward, CreateRewardInput, FileUploadResult } from './types'

interface EditRewardContentProps {
  /** Reward ID from URL params (passed via pageProps) */
  rewardId?: string
}

/**
 * EditRewardContent - Page content for editing an existing reward
 *
 * Features:
 * - Fetches reward data on load
 * - Displays edit form with pre-filled data and image preview
 * - Handles file upload for reward images
 * - Shows success/error feedback via toast
 * - Navigation back to rewards list
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'rewards-edit': () => import('../admin/rewards/EditRewardContent'),
 * ```
 *
 * @example
 * ```astro
 * // In rewards/[id]/edit.astro
 * <AdminLayout title="Edit Reward" page="rewards-edit" pageProps={{ rewardId: id }} />
 * ```
 */
export function EditRewardContent({ rewardId }: EditRewardContentProps) {
  const { selectedTrip } = useTripContext()
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Extract reward ID from URL if not passed as prop
  const effectiveRewardId = rewardId ?? (() => {
    if (typeof window === 'undefined') return null
    const match = window.location.pathname.match(/\/rewards\/([^/]+)\/edit/)
    return match?.[1] ?? null
  })()

  // Fetch reward data
  const {
    reward,
    loading: rewardLoading,
    error: rewardError,
  } = useGetRewardQuery(effectiveRewardId)

  const {
    getUploadUrl,
  } = useGetUploadUrl()

  // Navigate back to rewards list
  const handleCancel = useCallback(() => {
    window.location.href = '/rewards'
  }, [])

  // Handle file upload using storage service
  const handleUploadFile = useCallback(
    async (file: File): Promise<FileUploadResult> => {
      const uploadUrl = await getUploadUrl({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      })

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
    async (id: string, data: Omit<CreateRewardInput, 'tripId'>) => {
      if (!selectedTrip) {
        setSubmitError('No trip selected. Please select a trip first.')
        return
      }

      setSubmitError(null)

      try {
        // Show info that update is not implemented yet
        toast.error('Reward update is not yet implemented in the backend')
        console.log('Update reward:', id, data)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update reward'
        setSubmitError(message)
        toast.error(message)
      }
    },
    [selectedTrip]
  )

  const error = submitError

  // Render loading state
  if (rewardLoading) {
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
        <LoadingSpinner centered label="Loading reward..." />
      </YStack>
    )
  }

  // Render error state
  if (rewardError) {
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
        <ErrorMessage
          title="Failed to load reward"
          message={rewardError.message}
          onRetry={() => window.location.reload()}
        />
      </YStack>
    )
  }

  // Render reward not found state
  if (!reward) {
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
          <AlertCircle size={48} color="#9ca3af" />
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            Reward not found
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            The reward you're looking for doesn't exist or has been deleted
          </Text>
          <Button variant="primary" size="lg" onPress={handleCancel} marginTop="$4">
            Back to Rewards
          </Button>
        </YStack>
      </YStack>
    )
  }

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
            Please select a trip from the header before editing a reward
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
            Edit Reward
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {selectedTrip.name}
          </Text>
        </YStack>
      </XStack>

      {/* Form */}
      <EditRewardForm
        reward={reward}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={false}
        error={error}
        onUploadFile={handleUploadFile}
      />
    </YStack>
  )
}
