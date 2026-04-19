/**
 * Trip Context - Trip Selection State Management
 *
 * Provides a React Context for trip selection with localStorage persistence.
 * All admin data fetching is scoped to the selected trip.
 *
 * Features:
 * - Trip list fetching via GraphQL (useGetMyTripsQuery)
 * - localStorage persistence with namespaced key
 * - SSR-safe localStorage access (hydration-safe)
 * - Multi-tab synchronization via storage events
 * - Graceful empty state handling
 * - Trip change triggers data refresh
 *
 * ## Usage
 *
 * Wrap your application with TripProvider:
 *
 * ```tsx
 * import { TripProvider } from '@/contexts/TripContext';
 *
 * function App() {
 *   return (
 *     <TripProvider>
 *       <YourApp />
 *     </TripProvider>
 *   );
 * }
 * ```
 *
 * Access trip context in components:
 *
 * ```tsx
 * import { useTripContext } from '@/hooks/useTripContext';
 *
 * function MyComponent() {
 *   const { selectedTrip, setSelectedTrip, trips, loading } = useTripContext();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (!selectedTrip) return <NoTripsMessage />;
 *
 *   return <div>Current trip: {selectedTrip.name}</div>;
 * }
 * ```
 *
 * ## SSR Considerations
 *
 * When using with Astro SSR, mark interactive components with `client:load`:
 *
 * ```astro
 * <TripSelector client:load />
 * ```
 *
 * The provider is SSR-safe - localStorage is only accessed in useEffect.
 *
 * @module @mirai-app/web/contexts/TripContext
 */

'use client'

import React, { createContext, useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react'
import { useMyTripsQuery } from '@mirai-app/graphql-client'
import type { TripId } from '@mirai-app/domain'
import { TripId as TripIdFactory, isValidCUID } from '@mirai-app/domain'

// =============================================================================
// Types
// =============================================================================

/**
 * Trip entity representing a travel event with branded ID
 */
export interface Trip {
  /** Unique trip identifier (branded TripId type) */
  id: TripId
  /** Human-readable trip name */
  name: string
}

/**
 * Raw trip data from GraphQL response
 */
interface RawTrip {
  id: string
  name: string
}

/**
 * Trip context value shape
 *
 * Provides access to trip selection state and available trips.
 * All data fetching should be scoped to `selectedTrip.id`.
 */
export interface TripContextValue {
  /** Currently selected trip or null if none selected */
  selectedTrip: Trip | null
  /** Function to select a new trip (persists to localStorage) */
  setSelectedTrip: (trip: Trip) => void
  /** List of available trips for the current user */
  trips: Trip[]
  /** Whether trips are being fetched */
  loading: boolean
  /** Error if trip list fetch failed */
  error: Error | null
  /** Function to manually refresh trip list */
  refetch: () => void
}

/**
 * Event type for trip change notifications
 */
export interface TripChangeEvent {
  previousTrip: Trip | null
  currentTrip: Trip | null
  timestamp: number
}

// =============================================================================
// Constants
// =============================================================================

/** localStorage key for selected trip (namespaced to avoid collisions) */
const STORAGE_KEY = 'mirai:trip:selected'

/** Storage event name for cross-tab synchronization */
const STORAGE_EVENT = 'storage'

/** Custom event name for trip change notifications within the app */
const TRIP_CHANGE_EVENT = 'mirai:trip:change'

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Validates if a value matches the RawTrip shape from GraphQL
 */
function isValidRawTrip(item: unknown): item is RawTrip {
  if (typeof item !== 'object' || item === null) {
    return false
  }
  
  const obj = item as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    isValidCUID(obj.id)
  )
}

/**
 * Type guard for PaginatedTrips response structure
 */
function hasMyTrips(data: Record<string, unknown>): data is { myTrips: { trips: unknown[] } } {
  const myTrips = data.myTrips
  if (typeof myTrips !== 'object' || myTrips === null) {
    return false
  }
  
  const trips = (myTrips as Record<string, unknown>).trips
  return Array.isArray(trips)
}

// =============================================================================
// Context Creation
// =============================================================================

const TripContext = createContext<TripContextValue | undefined>(undefined)

/**
 * Hook to access the trip context
 *
 * @returns Trip context value with selected trip, trips list, and loading state
 * @throws Error if used outside of TripProvider
 *
 * @example
 * ```tsx
 * import { useTripContext } from '@/contexts/TripContext';
 *
 * function Dashboard() {
 *   const { selectedTrip, loading } = useTripContext();
 *
 *   // Use TripId.toString(selectedTrip.id) for GraphQL queries
 *   const tripIdString = selectedTrip ? TripId.toString(selectedTrip.id) : null;
 *
 *   return <div>Current trip: {selectedTrip?.name}</div>;
 * }
 * ```
 */
export function useTripContext(): TripContextValue {
  const context = useContext(TripContext)
  if (!context) {
    throw new Error(
      'useTripContext must be used within a TripProvider. ' +
      'Ensure your component tree is wrapped with TripProvider.'
    )
  }
  return context
}

// =============================================================================
// Event Emitter for Trip Changes
// =============================================================================

/**
 * Dispatches a custom event when trip changes
 * Downstream queries should listen to this event to trigger refetch
 */
function dispatchTripChangeEvent(previousTrip: Trip | null, currentTrip: Trip | null): void {
  if (typeof window === 'undefined') {
    return
  }
  
  const event: TripChangeEvent = {
    previousTrip,
    currentTrip,
    timestamp: Date.now(),
  }
  
  window.dispatchEvent(
    new CustomEvent<TripChangeEvent>(TRIP_CHANGE_EVENT, { detail: event })
  )
}

/**
 * Hook to subscribe to trip change events
 * Use this in downstream query hooks to trigger refetch when trip changes
 */
export function useTripChangeListener(callback: (event: TripChangeEvent) => void): void {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<TripChangeEvent>
      callback(customEvent.detail)
    }
    
    window.addEventListener(TRIP_CHANGE_EVENT, handler)
    return () => window.removeEventListener(TRIP_CHANGE_EVENT, handler)
  }, [callback])
}

// =============================================================================
// Storage Helpers (SSR-safe)
// =============================================================================

/**
 * Validates if a stored object has valid Trip shape with branded ID
 */
function isValidStoredTrip(obj: Record<string, unknown>): obj is { id: string; name: string } {
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    isValidCUID(obj.id)
  )
}

/**
 * Safely read from localStorage (only on client)
 */
function getStoredTrip(): Trip | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as unknown

    // Validate stored trip shape
    if (
      parsed &&
      typeof parsed === 'object' &&
      'id' in parsed &&
      'name' in parsed &&
      isValidStoredTrip(parsed as Record<string, unknown>)
    ) {
      // Create branded TripId from stored string
      return {
        id: TripIdFactory.unsafeCreate((parsed as { id: string }).id),
        name: (parsed as { name: string }).name,
      }
    }

    // Invalid stored data, remove it
    localStorage.removeItem(STORAGE_KEY)
    return null
  } catch (error) {
    // JSON parse error or localStorage unavailable
    console.warn('[TripContext] Failed to read from localStorage:', error)
    return null
  }
}

/**
 * Safely write to localStorage (only on client)
 */
function setStoredTrip(trip: Trip | null): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (trip) {
      // Store as plain object with string id
      const storableTrip = {
        id: TripIdFactory.toString(trip.id),
        name: trip.name,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storableTrip))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (error) {
    // localStorage unavailable or quota exceeded
    console.warn('[TripContext] Failed to write to localStorage:', error)
  }
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Props for TripProvider
 */
interface TripProviderProps {
  /** Child components */
  children: React.ReactNode
  /** Optional initial selected trip (overrides localStorage) */
  initialTrip?: Trip | null
}

/**
 * Trip Provider Component
 *
 * Wraps children with trip context, manages trip list fetching,
 * and handles localStorage persistence.
 *
 * Features:
 * - Automatically fetches user's trips on mount
 * - Restores selected trip from localStorage (SSR-safe)
 * - Synchronizes selection across browser tabs
 * - Validates stored trip against fetched trips
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TripProvider>
 *   <App />
 * </TripProvider>
 *
 * // With initial trip
 * <TripProvider initialTrip={{ 
 *   id: TripId.unsafeCreate('cm5xyz789uvw654rst321qpo0'), 
 *   name: 'Summer 2024' 
 * }}>
 *   <App />
 * </TripProvider>
 * ```
 */
export function TripProvider({ children, initialTrip }: TripProviderProps): React.ReactElement {
  // Fetch trips from GraphQL
  const queryResult = useMyTripsQuery()

  // Defensively extract from hook result
  const tripsResult = Array.isArray(queryResult) ? queryResult[0] : { data: undefined, fetching: true, error: undefined }
  const refetchFn = Array.isArray(queryResult) ? queryResult[1] : undefined

  // Safe extraction with defaults
  const data = tripsResult && typeof tripsResult === 'object' ? tripsResult.data : undefined
  const loading = tripsResult && typeof tripsResult === 'object' ? tripsResult.fetching : true
  const error = tripsResult && typeof tripsResult === 'object' ? tripsResult.error : undefined

  // Extract trips array from response with proper type safety
  const trips = useMemo<Trip[]>(() => {
    if (!data || typeof data !== 'object') {
      return []
    }

    const dataObj = data as Record<string, unknown>
    
    if (!hasMyTrips(dataObj)) {
      return []
    }

    const fetchedTrips = dataObj.myTrips.trips

    // Validate and convert to Trip type with branded ID
    return fetchedTrips.filter(isValidRawTrip).map((rawTrip) => ({
      id: TripIdFactory.unsafeCreate(rawTrip.id),
      name: rawTrip.name,
    }))
  }, [data])

  // Selected trip state (null during SSR, restored in useEffect)
  const [selectedTrip, setSelectedTripState] = useState<Trip | null>(initialTrip ?? null)

  // Track if initial hydration is complete
  const isHydrated = useRef(false)

  // Track previous trip for change detection
  const previousTripRef = useRef<Trip | null>(null)

  // =============================================================================
  // Hydration: Restore from localStorage on mount (SSR-safe)
  // =============================================================================

  useEffect(() => {
    // Skip if already hydrated or if initialTrip was provided
    if (isHydrated.current || initialTrip !== undefined) {
      isHydrated.current = true
      return
    }

    const stored = getStoredTrip()

    if (stored) {
      setSelectedTripState(stored)
    }

    isHydrated.current = true
  }, [initialTrip])

  // =============================================================================
  // Validation: Ensure selected trip exists in trips list
  // =============================================================================

  useEffect(() => {
    // Only validate after trips are loaded and hydration is complete
    if (loading || !isHydrated.current || trips.length === 0) {
      return
    }

    // If no trip is selected, auto-select first trip
    if (!selectedTrip) {
      const firstTrip = trips[0]
      if (firstTrip) {
        setSelectedTripState(firstTrip)
        setStoredTrip(firstTrip)
        previousTripRef.current = firstTrip
        dispatchTripChangeEvent(null, firstTrip)
      }
      return
    }

    // Validate that selected trip exists in the list
    const tripExists = trips.some((trip: Trip) => TripIdFactory.equals(trip.id, selectedTrip.id))
    if (!tripExists) {
      // Selected trip no longer available, select first available
      const firstTrip = trips[0]
      const previousTrip = selectedTrip
      
      if (firstTrip) {
        setSelectedTripState(firstTrip)
        setStoredTrip(firstTrip)
        previousTripRef.current = firstTrip
        dispatchTripChangeEvent(previousTrip, firstTrip)
      } else {
        // No trips available at all
        setSelectedTripState(null)
        setStoredTrip(null)
        dispatchTripChangeEvent(previousTrip, null)
      }
    }
  }, [trips, loading, selectedTrip])

  // =============================================================================
  // Multi-tab Synchronization
  // =============================================================================

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (event: StorageEvent) => {
      // Only respond to our storage key
      if (event.key !== STORAGE_KEY) {
        return
      }

      // Parse new value
      let newTrip: Trip | null = null
      
      if (event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as unknown
          if (
            parsed &&
            typeof parsed === 'object' &&
            'id' in parsed &&
            'name' in parsed &&
            isValidStoredTrip(parsed as Record<string, unknown>)
          ) {
            newTrip = {
              id: TripIdFactory.unsafeCreate((parsed as { id: string }).id),
              name: (parsed as { name: string }).name,
            }
          }
        } catch {
          // Invalid JSON, ignore
          return
        }
      }

      // Update state if different from current
      setSelectedTripState((current) => {
        if (!newTrip && !current) return current
        if (!newTrip || !current) {
          if (newTrip) {
            previousTripRef.current = newTrip
            dispatchTripChangeEvent(current, newTrip)
          }
          return newTrip
        }
        if (!TripIdFactory.equals(newTrip.id, current.id) || newTrip.name !== current.name) {
          previousTripRef.current = newTrip
          dispatchTripChangeEvent(current, newTrip)
          return newTrip
        }
        return current
      })
    }

    window.addEventListener(STORAGE_EVENT, handleStorageChange)
    return () => window.removeEventListener(STORAGE_EVENT, handleStorageChange)
  }, [])

  // =============================================================================
  // Trip Selection Handler with Change Notification
  // =============================================================================

  const setSelectedTrip = useCallback((trip: Trip) => {
    const previousTrip = selectedTrip
    setSelectedTripState(trip)
    setStoredTrip(trip)
    previousTripRef.current = trip
    dispatchTripChangeEvent(previousTrip, trip)
  }, [selectedTrip])

  // =============================================================================
  // Manual Refetch
  // =============================================================================

  const refetch = useCallback(() => {
    if (typeof refetchFn === 'function') {
      refetchFn()
    }
  }, [refetchFn])

  // Safely extract error message
  const safeError = useMemo(() => {
    if (!error) return null
    // Handle different error shapes
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Failed to fetch trips'
    return new Error(message)
  }, [error])

  // =============================================================================
  // Context Value
  // =============================================================================

  const contextValue = useMemo<TripContextValue>(
    () => ({
      selectedTrip,
      setSelectedTrip,
      trips,
      loading,
      error: safeError,
      refetch,
    }),
    [selectedTrip, setSelectedTrip, trips, loading, safeError, refetch]
  )

  return (
    <TripContext.Provider value={contextValue}>
      {children}
    </TripContext.Provider>
  )
}

// =============================================================================
// Export Types
// =============================================================================

export type { TripProviderProps }
