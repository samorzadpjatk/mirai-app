/**
 * Notifications Module - Barrel Export
 *
 * Provides a centralized export point for all notification-related components,
 * hooks, types, and utilities. This enables clean imports throughout the app.
 *
 * @module @/components/admin/notifications
 *
 * @example
 * ```tsx
 * // Import everything
 * import * as Notifications from '@/components/admin/notifications';
 *
 * // Use components
 * <Notifications.NotificationsPageContent />
 * <Notifications.CreateNotificationContent />
 *
 * // Use hooks
 * const { notifications } = Notifications.useGetNotificationsQuery(tripId);
 * const { latestNotification } = Notifications.useNotificationReceivedSubscription();
 *
 * // Use types
 * type Notification = Notifications.Notification;
 * ```
 *
 * @example
 * ```tsx
 * // Import specific items
 * import {
 *   NotificationsPageContent,
 *   CreateNotificationForm,
 *   useGetNotificationsQuery,
 *   useNotificationReceivedSubscription,
 *   type Notification,
 * } from '@/components/admin/notifications';
 * ```
 */

// =============================================================================
// Components
// =============================================================================

export { NotificationsPage, NotificationsPageContent } from './NotificationsPage'
export { CreateNotificationContent } from './CreateNotificationContent'
export { CreateNotificationForm } from './CreateNotificationForm'
export { NotificationCard, NotificationCardSkeleton } from './NotificationCard'

// =============================================================================
// Hooks
// =============================================================================

export {
  useGetNotificationsQuery,
  useCreateNotificationMutation,
  useDeleteNotificationMutation,
  useNotificationReceivedSubscription,
} from './hooks'

// =============================================================================
// Types & Schemas
// =============================================================================

export type {
  Notification,
  CreateNotificationInput,
  NotificationTargetType,
} from './types'

export {
  createNotificationSchema,
  type CreateNotificationSchema,
} from './types'
