/**
 * Rewards Module - Barrel Export
 *
 * Provides a centralized export point for all reward-related components,
 * hooks, types, and utilities. This enables clean imports throughout the app.
 *
 * @module @/components/admin/rewards
 *
 * @example
 * ```tsx
 * // Import everything
 * import * as Rewards from '@/components/admin/rewards';
 *
 * // Use components
 * <Rewards.RewardsPageContent />
 * <Rewards.CreateRewardContent />
 *
 * // Use hooks
 * const { rewards } = Rewards.useGetRewardsQuery(tripId);
 *
 * // Use types
 * type Reward = Rewards.Reward;
 * ```
 *
 * @example
 * ```tsx
 * // Import specific items
 * import {
 *   RewardsPageContent,
 *   CreateRewardForm,
 *   useGetRewardsQuery,
 *   type Reward,
 * } from '@/components/admin/rewards';
 * ```
 */

// =============================================================================
// Components
// =============================================================================

export { RewardsPage, RewardsPageContent } from './RewardsPage'
export { CreateRewardContent } from './CreateRewardContent'
export { EditRewardContent } from './EditRewardContent'
export { CreateRewardForm } from './CreateRewardForm'
export { EditRewardForm } from './EditRewardForm'
export { RewardCard, RewardCardSkeleton } from './RewardCard'

// =============================================================================
// Hooks
// =============================================================================

export {
  useGetRewardsQuery,
  useGetRewardQuery,
  useCreateRewardMutation,
  useDeleteRewardMutation,
  useGetUploadUrl,
} from './hooks'

// =============================================================================
// Types & Schemas
// =============================================================================

export type {
  Reward,
  CreateRewardInput,
  UpdateRewardInput,
  FileUploadResult,
  FileUploadProps,
} from './types'

export {
  createRewardSchema,
  updateRewardSchema,
  type CreateRewardSchema,
  type UpdateRewardSchema,
} from './types'
