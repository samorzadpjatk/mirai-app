/**
 * UsersPageContent Component
 *
 * Displays the list of users for the selected trip.
 * Features:
 * - Fetches users via GraphQL query
 * - Displays users in a card list
 * - Supports navigation to create/edit pages
 * - Handles loading and error states
 * - Delete confirmation with cache invalidation
 *
 * @module @/components/admin/users/UsersPageContent
 */

'use client'

import { useCallback, useState, useMemo } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
} from '@mirai-app/ui'
import { Plus, AlertCircle } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { toast } from 'react-hot-toast'
import {
  useGetUsersQuery,
  useDeleteUserMutation,
} from './hooks'
import { UserCard, UserCardSkeleton } from './UserCard'
import type { User } from './types'

/**
 * UsersPageContent - Main content for the users list page
 *
 * Fetches users for the selected trip and displays them in a list.
 * Supports creating, editing, and deleting users.
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'users': () => import('../admin/users/UsersPageContent'),
 * ```
 */
export function UsersPageContent() {
  const { selectedTrip } = useTripContext()
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Get trip ID as string for the query
  const tripIdString = selectedTrip ? TripId.toString(selectedTrip.id) : ''

  // Fetch users
  const {
    users,
    loading: usersLoading,
    error: usersError,
    refetch,
  } = useGetUsersQuery(tripIdString)

  // Delete mutation
  const {
    deleteUser,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteUserMutation()

  // Navigate to create user page
  const handleCreateClick = useCallback(() => {
    window.location.href = '/users/new'
  }, [])

  // Navigate to edit user page
  const handleEditClick = useCallback((user: User) => {
    window.location.href = `/users/${user.id}/edit`
  }, [])

  // Open delete confirmation
  const handleDeleteClick = useCallback((user: User) => {
    setUserToDelete(user)
  }, [])

  // Close delete confirmation
  const handleCancelDelete = useCallback(() => {
    setUserToDelete(null)
  }, [])

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!userToDelete) return

    try {
      await deleteUser(userToDelete.id)
      toast.success(`User ${userToDelete.firstName} ${userToDelete.lastName} deleted successfully`)
      setUserToDelete(null)
      // Cache is automatically invalidated by the mutation updater
      // but we can optionally refetch to ensure consistency
      refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user'
      toast.error(message)
    }
  }, [userToDelete, deleteUser, refetch])

  // Render loading state
  if (usersLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Users
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
            disabled
          >
            <Plus size={18} />
            Add User
          </Button>
        </XStack>
        <YStack gap="$3">
          {[...Array(5)].map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </YStack>
      </YStack>
    )
  }

  // Render error state
  if (usersError) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Users
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
          >
            <Plus size={18} />
            Add User
          </Button>
        </XStack>
        <ErrorMessage
          title="Failed to load users"
          message={usersError.message}
          onRetry={refetch}
        />
      </YStack>
    )
  }

  // Render empty trip state
  if (!selectedTrip) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <AlertCircle size={48} color="#9ca3af" />
        <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
          No trip selected
        </Text>
        <Text fontSize="$3" color="$colorMuted" textAlign="center">
          Please select a trip from the header to view users
        </Text>
      </YStack>
    )
  }

  // Render empty users state
  if (users.length === 0) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Users
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
          >
            <Plus size={18} />
            Add User
          </Button>
        </XStack>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            No users yet
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            Get started by adding your first user to {selectedTrip.name}
          </Text>
          <Button variant="primary" size="lg" onPress={handleCreateClick} marginTop="$4">
            <Plus size={20} />
            Add User
          </Button>
        </YStack>
      </YStack>
    )
  }

  // Render users list
  return (
    <YStack flex={1}>
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$4"
        flexWrap="wrap"
        gap="$2"
      >
        <YStack>
          <Text fontSize="$6" fontWeight="600">
            Users
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {users.length} {users.length === 1 ? 'user' : 'users'} in {selectedTrip.name}
          </Text>
        </YStack>
        <Button
          variant="primary"
          size="md"
          onPress={handleCreateClick}
        >
          <Plus size={18} />
          Add User
        </Button>
      </XStack>

      {/* Users list */}
      <YStack gap="$3">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        ))}
      </YStack>

      {/* Delete confirmation sheet */}
      <Sheet
        open={!!userToDelete}
        onOpenChange={(open: boolean) => !open && handleCancelDelete()}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            Delete User
          </Text>
          <Text fontSize="$4" color="$color">
            Are you sure you want to delete{' '}
            <Text fontWeight="600">
              {userToDelete?.firstName} {userToDelete?.lastName}
            </Text>
            ?
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            This action cannot be undone. The user will be permanently removed from the trip.
          </Text>

          {deleteError && (
            <YStack
              padding="$3"
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderRadius="$2"
              borderWidth={1}
              borderColor="#ef4444"
            >
              <Text color="#ef4444" fontSize="$3">
                {deleteError.message}
              </Text>
            </YStack>
          )}

          <XStack gap="$3" marginTop="$2">
            <Button
              variant="secondary"
              size="lg"
              onPress={handleCancelDelete}
              disabled={deleteLoading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="lg"
              onPress={handleConfirmDelete}
              disabled={deleteLoading}
              isLoading={deleteLoading}
              flex={1}
            >
              Delete
            </Button>
          </XStack>
        </YStack>
      </Sheet>
    </YStack>
  )
}
