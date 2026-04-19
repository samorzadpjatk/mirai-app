'use client'

import { YStack, Text } from '@mirai-app/ui'

/**
 * Dashboard content placeholder.
 * Full implementation in Step 9.
 */
export function DashboardContent() {
  return (
    <YStack gap="$4">
      <Text fontSize="$8" fontWeight="700">
        Dashboard
      </Text>
      <Text color="$color10">
        Welcome to the MIRAI Admin Dashboard.
      </Text>
    </YStack>
  )
}
