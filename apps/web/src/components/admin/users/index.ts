/**
 * Users Module - Barrel Export
 *
 * Provides a centralized export point for all user-related components,
 * hooks, types, and utilities. This enables clean imports throughout the app.
 *
 * @module @/components/admin/users
 *
 * @example
 * ```tsx
 * // Import everything
 * import * as Users from '@/components/admin/users';
 *
 * // Use components
 * <Users.UsersPageContent />
 * <Users.CreateUserContent />
 *
 * // Use hooks
 * const { users } = Users.useGetUsersQuery(tripId);
 *
 * // Use types
 * type User = Users.User;
 * ```
 *
 * @example
 * ```tsx
 * // Import specific items
 * import {
 *   UsersPageContent,
 *   CreateUserForm,
 *   useGetUsersQuery,
 *   type User,
 * } from '@/components/admin/users';
 * ```
 */

// =============================================================================
// Components
// =============================================================================

export { UsersPage, UsersPageContent } from './UsersPage'
export { CreateUserContent } from './CreateUserContent'
export { EditUserContent } from './EditUserContent'
export { CreateUserForm } from './CreateUserForm'
export { EditUserForm } from './EditUserForm'
export { UserCard, UserCardSkeleton } from './UserCard'

// =============================================================================
// Hooks
// =============================================================================

export {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from './hooks'

// =============================================================================
// Types & Schemas
// =============================================================================

export type {
  User,
  CreateUserInput,
  UpdateUserInput,
} from './types'

export {
  createUserSchema,
  updateUserSchema,
  type CreateUserSchema,
  type UpdateUserSchema,
} from './types'
