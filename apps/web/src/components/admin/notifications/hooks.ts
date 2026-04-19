/**
 * Notification Hooks - GraphQL Query, Mutation, and Subscription Hooks
 *
 * Provides urql-based hooks for notification CRUD operations and real-time
 * delivery via subscriptions. These hooks integrate with the cacheExchange
 * for automatic cache updates.
 *
 * @module @/components/admin/notifications/hooks
 */

'use client'

import { useQuery, useMutation, useSubscription } from 'urql'
import { gql } from '@urql/core'
import type { Notification, CreateNotificationInput } from './types'

// =============================================================================
// GraphQL Document Nodes
// =============================================================================

/**
 * GraphQL query to fetch notifications for a specific trip
 */
export const GetNotificationsDocument = gql`
  query GetNotifications($tripId: String!, $first: Int, $after: String) {
    notifications(tripId: $tripId, first: $first, after: $after) {
      edges {
        node {
          id
          title
          body
          url
          tripId
          createdById
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

/**
 * GraphQL mutation to create a new notification
 */
export const CreateNotificationDocument = gql`
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      id
      title
      body
      url
      tripId
      createdById
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQL mutation to delete a notification
 */
export const DeleteNotificationDocument = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) {
      id
    }
  }
`

/**
 * GraphQL subscription for real-time notification delivery
 * This subscription receives notifications as they are sent
 */
export const NotificationReceivedDocument = gql`
  subscription NotificationReceived {
    notificationReceived {
      id
      title
      body
      url
      tripId
      createdById
      createdAt
    }
  }
`

// =============================================================================
// Type Definitions for Query Results
// =============================================================================

export interface GetNotificationsQueryResult {
  notifications: {
    edges: Array<{
      node: Notification
      cursor: string
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

export interface GetNotificationsQueryVariables {
  tripId: string
  first?: number
  after?: string | null
}

export interface CreateNotificationMutationResult {
  createNotification: Notification
}

export interface CreateNotificationMutationVariables {
  input: CreateNotificationInput
}

export interface DeleteNotificationMutationResult {
  deleteNotification: { id: string }
}

export interface DeleteNotificationMutationVariables {
  id: string
}

export interface NotificationReceivedSubscriptionResult {
  notificationReceived: Notification | null
}

export interface NotificationReceivedSubscriptionVariables {
  // No variables needed - subscription receives all notifications for authenticated user
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseGetNotificationsQueryResult {
  /** List of notifications for the selected trip */
  notifications: Notification[]
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
  /** Refetch the notifications list */
  refetch: () => void
  /** Whether there are more notifications to load */
  hasMore: boolean
  /** Load more notifications (pagination) */
  loadMore: () => void
}

export interface UseCreateNotificationMutationResult {
  /** Create a new notification */
  createNotification: (input: CreateNotificationInput) => Promise<Notification>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseDeleteNotificationMutationResult {
  /** Delete a notification */
  deleteNotification: (id: string) => Promise<void>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseNotificationReceivedSubscriptionResult {
  /** Latest notification received via subscription */
  latestNotification: Notification | null
  /** Whether the subscription is active */
  isSubscribing: boolean
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch notifications for a specific trip
 *
 * Uses urql's useQuery with automatic cache management.
 * The cache is invalidated when notifications are created/deleted.
 *
 * @param tripId - The trip ID to fetch notifications for
 * @returns Query result with notifications list, loading state, and error
 *
 * @example
 * ```tsx
 * const { notifications, loading, error, hasMore, loadMore } = useGetNotificationsQuery(tripId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 *
 * return <NotificationList notifications={notifications} />;
 * ```
 */
export function useGetNotificationsQuery(tripId: string): UseGetNotificationsQueryResult {
  const [result, reexecuteQuery] = useQuery<GetNotificationsQueryResult, GetNotificationsQueryVariables>({
    query: GetNotificationsDocument,
    variables: { tripId, first: 50 },
    pause: !tripId,
  })

  const notifications = result.data?.notifications.edges.map(edge => edge.node) ?? []
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null
  const hasMore = result.data?.notifications.pageInfo.hasNextPage ?? false

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  const loadMore = () => {
    if (!hasMore || !result.data?.notifications.pageInfo.endCursor) return
    reexecuteQuery({
      variables: {
        tripId,
        first: 50,
        after: result.data.notifications.pageInfo.endCursor,
      },
    })
  }

  return {
    notifications,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  }
}

/**
 * Hook to create a new notification
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful creation, the notifications list cache is invalidated.
 *
 * @returns Mutation result with create function, loading state, and error
 *
 * @example
 * ```tsx
 * const { createNotification, loading } = useCreateNotificationMutation();
 *
 * const handleSubmit = async (input) => {
 *   const notification = await createNotification(input);
 *   // Notification created, cache automatically updated
 * };
 * ```
 */
export function useCreateNotificationMutation(): UseCreateNotificationMutationResult {
  const [result, executeMutation] = useMutation<
    CreateNotificationMutationResult,
    CreateNotificationMutationVariables
  >(CreateNotificationDocument)

  const createNotification = async (input: CreateNotificationInput): Promise<Notification> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.createNotification) {
      throw new Error('Failed to create notification: no data returned')
    }

    return response.data.createNotification
  }

  return {
    createNotification,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to delete a notification
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful deletion, the notification is removed from cache
 * and the notifications list is invalidated.
 *
 * @returns Mutation result with delete function, loading state, and error
 *
 * @example
 * ```tsx
 * const { deleteNotification, loading } = useDeleteNotificationMutation();
 *
 * const handleDelete = async (id) => {
 *   await deleteNotification(id);
 *   // Notification deleted, cache automatically updated
 * };
 * ```
 */
export function useDeleteNotificationMutation(): UseDeleteNotificationMutationResult {
  const [result, executeMutation] = useMutation<
    DeleteNotificationMutationResult,
    DeleteNotificationMutationVariables
  >(DeleteNotificationDocument)

  const deleteNotification = async (id: string): Promise<void> => {
    const response = await executeMutation({ id })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    deleteNotification,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to subscribe to real-time notification delivery
 *
 * Uses urql's useSubscription to receive notifications as they are sent.
 * This enables real-time updates without polling.
 *
 * @returns Subscription result with latest notification and subscription status
 *
 * @example
 * ```tsx
 * const { latestNotification, isSubscribing } = useNotificationReceivedSubscription();
 *
 * useEffect(() => {
 *   if (latestNotification) {
 *     // Show toast or update UI with new notification
 *     toast.info(`New notification: ${latestNotification.title}`);
 *   }
 * }, [latestNotification]);
 * ```
 */
export function useNotificationReceivedSubscription(): UseNotificationReceivedSubscriptionResult {
  const [result] = useSubscription<
    NotificationReceivedSubscriptionResult,
    NotificationReceivedSubscriptionVariables
  >(
    {
      query: NotificationReceivedDocument,
    }
  )

  const latestNotification = result.data?.notificationReceived ?? null
  const isSubscribing = !result.error && !result.fetching

  return {
    latestNotification,
    isSubscribing,
  }
}
