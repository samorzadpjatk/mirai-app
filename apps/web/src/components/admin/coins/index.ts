/**
 * Coins Module - Barrel Export
 *
 * Provides a centralized export point for all coin-related components,
 * hooks, types, and utilities. This enables clean imports throughout the app.
 *
 * @module @/components/admin/coins
 *
 * @example
 * ```tsx
 * // Import everything
 * import * as Coins from '@/components/admin/coins';
 *
 * // Use components
 * <Coins.CoinsOverviewPage />
 * <Coins.CoinsPageContent />
 *
 * // Use hooks
 * const { balances } = Coins.useGetCoinBalancesQuery(tripId);
 *
 * // Use types
 * type CoinBalance = Coins.CoinBalance;
 * ```
 *
 * @example
 * ```tsx
 * // Import specific items
 * import {
 *   CoinsOverviewPage,
 *   CoinsPageContent,
 *   useGetCoinBalancesQuery,
 *   type CoinBalance,
 * } from '@/components/admin/coins';
 * ```
 */

// =============================================================================
// Components
// =============================================================================

export { CoinsOverviewPage, CoinsPageContent } from './CoinsOverviewPage'
export { CoinCard, CoinCardSkeleton } from './CoinCard'
export { CoinOperationForm } from './CoinOperationForm'

// =============================================================================
// Hooks
// =============================================================================

export {
  useGetCoinBalancesQuery,
  useGetGroupTransactionsQuery,
  useAddGroupCoinsMutation,
} from './hooks'

// =============================================================================
// Types & Schemas
// =============================================================================

export type {
  CoinBalance,
  CoinTransaction,
  CoinOperationResult,
  AddCoinsInput,
  RemoveCoinsInput,
} from './types'

export {
  coinOperationSchema,
  addCoinsSchema,
  removeCoinsSchema,
  type CoinOperationSchema,
  type AddCoinsSchema,
  type RemoveCoinsSchema,
} from './types'
