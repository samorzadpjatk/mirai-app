/**
 * Trip Selector Component
 *
 * Dropdown component for selecting the current trip.
 * Integrates with TripContext to display available trips and handle selection.
 *
 * Features:
 * - Displays list of available trips from TripContext
 * - Persists selection to localStorage
 * - Shows loading state while fetching trips
 * - Graceful empty state when no trips available
 * - SSR-safe with client:load directive
 *
 * ## Usage
 *
 * In Astro layouts:
 *
 * ```astro
 * ---
 * import { TripSelector } from '@/components/TripSelector';
 * ---
 *
 * <TripSelector client:load />
 * ```
 *
 * The `client:load` directive ensures the component only hydrates on the
 * client side, avoiding SSR/localStorage hydration mismatches.
 *
 * @module @mirai-app/web/components/TripSelector
 */

'use client'

import { memo, useCallback, useMemo } from 'react'
import { Select, YStack, Text, XStack, Spinner } from '@mirai-app/ui'
import { useTripContext } from '@/hooks/useTripContext'

/**
 * Trip selector dropdown component
 *
 * Renders a Select component populated with available trips.
 * Selecting a trip updates the TripContext and persists to localStorage.
 *
 * @returns Trip selector dropdown or loading/empty state
 *
 * @example
 * ```tsx
 * // In a header component
 * import { TripSelector } from './TripSelector';
 *
 * export function Header() {
 *   return (
 *     <header>
 *       <TripSelector />
 *     </header>
 *   );
 * }
 * ```
 */
export const TripSelector = memo(function TripSelector() {
  const { selectedTrip, setSelectedTrip, trips, loading, error } = useTripContext()

  // Handle trip selection change
  const handleValueChange = useCallback(
    (value: string) => {
      const trip = trips.find((t) => t.id === value)
      if (trip) {
        setSelectedTrip(trip)
      }
    },
    [trips, setSelectedTrip]
  )

  // Current selection value (empty string if none selected)
  const currentValue = useMemo(() => {
    return selectedTrip?.id ?? ''
  }, [selectedTrip])

  // Loading state
  if (loading) {
    return (
      <YStack>
        <XStack
          width={200}
          height={40}
          alignItems="center"
          justifyContent="center"
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$4"
          paddingHorizontal="$3"
        >
          <Spinner size="small" color="$colorMuted" />
        </XStack>
      </YStack>
    )
  }

  // Error state
  if (error) {
    return (
      <YStack>
        <XStack
          width={200}
          height={40}
          alignItems="center"
          backgroundColor="$background"
          borderColor="red"
          borderWidth={1}
          borderRadius="$4"
          paddingHorizontal="$3"
        >
          <Text fontSize="$3" color="red">
            Failed to load trips
          </Text>
        </XStack>
      </YStack>
    )
  }

  // Empty state - no trips available
  if (trips.length === 0) {
    return (
      <YStack>
        <XStack
          width={200}
          height={40}
          alignItems="center"
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$4"
          paddingHorizontal="$3"
        >
          <Text fontSize="$3" color="$colorMuted">
            No trips available
          </Text>
        </XStack>
      </YStack>
    )
  }

  // Normal state - trips available
  return (
    <YStack>
      <Select value={currentValue} onValueChange={handleValueChange} disablePreventBodyScroll>
        <Select.Trigger
          width={200}
          iconAfter={null}
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$4"
          paddingHorizontal="$3"
          paddingVertical="$2"
          disabled={trips.length === 0}
        >
          <Select.Value placeholder="Select a trip" />
        </Select.Trigger>

        <Select.Content zIndex={200}>
          <Select.Viewport>
            <Select.Group>
              {trips.map((trip, index) => (
                <Select.Item key={trip.id} index={index} value={trip.id}>
                  <Select.ItemText>
                    <Text fontSize="$3">{trip.name}</Text>
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Viewport>
        </Select.Content>
      </Select>
    </YStack>
  )
})
