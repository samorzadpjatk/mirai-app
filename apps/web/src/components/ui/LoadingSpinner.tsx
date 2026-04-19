'use client'

import { Spinner, YStack, Text } from '@mirai-app/ui'
import { memo } from 'react'

export interface LoadingSpinnerProps {
  /** Label displayed below the spinner */
  label?: string
  /** Size of the spinner in pixels */
  size?: 'small' | 'medium' | 'large'
  /** Whether to center the spinner in its container */
  centered?: boolean
}

const sizeMap: Record<string, 'small' | 'large' | undefined> = {
  small: 'small',
  medium: undefined,
  large: 'large',
}

/**
 * Loading spinner component with optional label
 * Uses Tamagui Spinner for consistent theming
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  label,
  size = 'medium',
  centered = true,
}: LoadingSpinnerProps) {
  const spinnerSize = sizeMap[size]

  const content = (
    <YStack gap='$2' alignItems='center' justifyContent='center'>
      <Spinner size={spinnerSize} color='$color' />
      {label && (
        <Text fontSize='$3' color='$colorMuted'>
          {label}
        </Text>
      )}
    </YStack>
  )

  if (centered) {
    return (
      <YStack flex={1} alignItems='center' justifyContent='center' padding='$4'>
        {content}
      </YStack>
    )
  }

  return content
})

export default LoadingSpinner
