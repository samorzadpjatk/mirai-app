/**
 * useTripContext Hook
 *
 * Convenience hook for accessing the TripContext.
 * Re-exports useTripContext from TripContext module for cleaner imports.
 * Includes generic constraint support for type-safe extensions.
 *
 * ## Usage
 *
 * ### Basic Usage (Standard Trip Context)
 * ```tsx
 * import { useTripContext } from '@/hooks/useTripContext';
 *
 * function MyComponent() {
 *   const { selectedTrip, setSelectedTrip, trips, loading } = useTripContext();
 *
 *   // Use TripId.toString(selectedTrip.id) for GraphQL queries
 *   const tripIdString = selectedTrip ? TripId.toString(selectedTrip.id) : null;
 *
 *   return <div>Trip: {selectedTrip?.name}</div>;
 * }
 * ```
 *
 * ### With Extended Trip Type (Generic Constraints)
 * ```tsx
 * import { useTripContext } from '@/hooks/useTripContext';
 * import type { TripId } from '@mirai-app/domain';
 *
 * interface ExtendedTrip {
 *   id: TripId;
 *   name: string;
 *   startDate: Date;
 * }
 *
 * function MyComponent() {
 *   // Generic constraint ensures type safety with extended trip shapes
 *   const { selectedTrip, trips } = useTripContext<ExtendedTrip>();
 *
 *   return <div>Start: {selectedTrip?.startDate?.toLocaleDateString()}</div>;
 * }
 * ```
 *
 * ## Error Handling
 *
 * Throws if used outside of TripProvider. Ensure your component tree
 * is wrapped with TripProvider (typically in GlobalProviders or Layout).
 *
 * ## Type Safety
 *
 * Fully typed with TripContextValue interface and generic constraints:
 * - selectedTrip: Trip | null
 * - setSelectedTrip: (trip: Trip) => void
 * - trips: Trip[]
 * - loading: boolean
 * - error: Error | null
 * - refetch: () => void
 *
 * Generic parameter T extends TripBase constraint ensures:
 * - All trip types must have branded `id: TripId` property
 * - All trip types must have `name: string` property
 * - Extended properties are type-safe and optional
 *
 * @module @mirai-app/web/hooks/useTripContext
 */

import type { TripId } from '@mirai-app/domain'

/**
 * Base interface that all trip types must extend.
 * Ensures type safety for generic constraints.
 */
interface TripBase {
  /** Unique trip identifier (branded TripId type) */
  id: TripId
  /** Human-readable trip name */
  name: string
}

/**
 * Generic interface for extended trip context values.
 * @template T - Trip type extending TripBase (must have branded id and name)
 */
interface TripContextValueGeneric<T extends TripBase> {
  /** Currently selected trip or null if none selected */
  selectedTrip: T | null
  /** Function to select a new trip (persists to localStorage) */
  setSelectedTrip: (trip: T) => void
  /** List of available trips for the current user */
  trips: T[]
  /** Whether trips are being fetched */
  loading: boolean
  /** Error if trip list fetch failed */
  error: Error | null
  /** Function to manually refresh trip list */
  refetch: () => void
}

/**
 * Re-export the base TripContextValue type
 */
export type { TripContextValue } from '@/contexts/TripContext'

/**
 * Re-export the base Trip type with branded ID
 */
export type { Trip } from '@/contexts/TripContext'

/**
 * Hook to access the trip context with optional generic type parameter.
 *
 * @template T - Extended trip type (defaults to base Trip)
 * @returns Trip context value with selected trip, trips list, and loading state
 * @throws Error if used outside of TripProvider
 *
 * @example
 * ```tsx
 * // Standard usage
 * const { selectedTrip, loading } = useTripContext();
 *
 * // With extended trip type
 * interface MyTrip extends Trip {
 *   startDate: Date;
 * }
 * const { selectedTrip } = useTripContext<MyTrip>();
 * ```
 */
export function useTripContext<T extends TripBase = TripBase>(): TripContextValueGeneric<T> {
  // Import from the context module at runtime
  const { useTripContext: useBaseTripContext } = require('@/contexts/TripContext')
  return useBaseTripContext()
}

/**
 * Re-export hook for direct import from TripContext.
 * This maintains backward compatibility with existing imports.
 */
export { useTripContext as useBaseTripContext } from '@/contexts/TripContext'

/**
 * Re-export trip change listener for downstream query hooks
 */
export { useTripChangeListener } from '@/contexts/TripContext'

/**
 * Re-export trip change event type for TypeScript consumers
 */
export type { TripChangeEvent } from '@/contexts/TripContext'
