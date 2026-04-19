'use client'

import { useState, useMemo, useCallback } from 'react'
import { YStack, XStack, Text, Button, Input } from '@mirai-app/ui'
import { Plus, Search } from 'lucide-react'
import { useTripContext } from '@/hooks/useTripContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { TripId } from '@mirai-app/domain'
import { useGetGroupsQuery } from './hooks'
import { GroupCard, GroupCardSkeleton } from './GroupCard'

export function GroupsPageContent() {
  const { selectedTrip } = useTripContext()
  const [searchTerm, setSearchTerm] = useState('')
  const tripId = selectedTrip ? TripId.toString(selectedTrip.id) : null

  // Fetch groups using real urql hook
  const { groups, loading, error, refetch } = useGetGroupsQuery(tripId)

  // Filter groups by search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups

    const term = searchTerm.toLowerCase()
    return groups.filter((group) =>
      group.name.toLowerCase().includes(term)
    )
  }, [groups, searchTerm])

  const handleCreate = useCallback(() => {
    window.location.href = '/groups/new'
  }, [])

  const handleEdit = useCallback((groupId: string) => {
    window.location.href = `/groups/edit/${groupId}`
  }, [])

  // Show loading state
  if (loading) {
    return (
      <YStack gap="$4" padding="$4">
        <GroupCardSkeleton />
        <GroupCardSkeleton />
        <GroupCardSkeleton />
      </YStack>
    )
  }

  // Show error state
  if (error) {
    return (
      <YStack gap="$4" padding="$4">
        <ErrorMessage message={`Failed to load groups: ${error.message}`} />
        <Button onPress={() => refetch()}>Retry</Button>
      </YStack>
    )
  }

  // Show no trip selected state
  if (!selectedTrip) {
    return (
      <YStack gap="$4" padding="$4" alignItems="center">
        <Text fontSize="$5" color="$colorMuted">
          Please select a trip to view groups
        </Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$4" flex={1}>
      {/* Header with search and create button */}
      <XStack gap="$3" alignItems="center">
        <XStack flex={1} position="relative">
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
          <Input
            flex={1}
            placeholder="Search groups by name..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            paddingLeft="$8"
          />
        </XStack>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={18} />}
          onPress={handleCreate}
          accessibilityLabel="Create new group"
        >
          Create
        </Button>
      </XStack>

      {/* Groups list */}
      <YStack gap="$3" paddingBottom="$4">
        {filteredGroups.length === 0 ? (
          <YStack
            alignItems="center"
            justifyContent="center"
            padding="$8"
            gap="$4"
          >
            <Text fontSize="$5" color="$colorMuted" textAlign="center">
              {searchTerm ? 'No groups found matching your search' : 'No groups available'}
            </Text>
            {!searchTerm && (
              <Button onPress={handleCreate} variant="primary">
                Create your first group
              </Button>
            )}
          </YStack>
        ) : (
          filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} onEdit={handleEdit} />
          ))
        )}
      </YStack>
    </YStack>
  )
}
