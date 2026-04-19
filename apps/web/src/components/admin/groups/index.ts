/**
 * Groups Module - Barrel Export
 *
 * Provides a centralized export point for all group-related components,
 * hooks, types, and utilities. This enables clean imports throughout the app.
 *
 * @module @/components/admin/groups
 *
 * @example
 * ```tsx
 * // Import everything
 * import * as Groups from '@/components/admin/groups';
 *
 * // Use components
 * <Groups.GroupsPageContent />
 * <Groups.CreateGroupContent />
 *
 * // Use hooks
 * const { groups } = Groups.useGetGroupsQuery(tripId);
 *
 * // Use types
 * type Group = Groups.Group;
 * ```
 *
 * @example
 * ```tsx
 * // Import specific items
 * import {
 *   GroupsPageContent,
 *   CreateGroupForm,
 *   useGetGroupsQuery,
 *   type Group,
 * } from '@/components/admin/groups';
 * ```
 */

// =============================================================================
// Components
// =============================================================================

export { GroupsPage, GroupsPageContent } from './GroupsPage'
export { CreateGroupContent } from './CreateGroupContent'
export { EditGroupContent } from './EditGroupContent'
export { CreateGroupForm } from './CreateGroupForm'
export { EditGroupForm } from './EditGroupForm'
export { GroupCard, GroupCardSkeleton } from './GroupCard'

// =============================================================================
// Hooks
// =============================================================================

export {
  useGetGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} from './hooks'

// =============================================================================
// Types & Schemas
// =============================================================================

export type {
  Group,
  CreateGroupInput,
  UpdateGroupInput,
} from './types'

export {
  createGroupSchema,
  updateGroupSchema,
  type CreateGroupSchema,
  type UpdateGroupSchema,
} from './types'
