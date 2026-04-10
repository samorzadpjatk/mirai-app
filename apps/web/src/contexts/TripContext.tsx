"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { GraphQLClient } from "graphql-request";
import { useGetTripsQuery } from "@mirai-app/graphql-types";
import { env } from "../lib/env";
import { ACTIVE_TRIP_STORAGE_KEY } from "../hooks/useActiveTripId";

interface Trip {
  id: string;
  name: string;
}

interface TripContextType {
  selectedTrip: Trip | null;
  setSelectedTrip: (trip: Trip | null) => void;
  trips: Trip[];
  isLoading: boolean;
  error: Error | null;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

interface TripProviderProps {
  children: ReactNode;
}

/**
 * Create a GraphQL client instance for use with generated hooks
 *
 * The generated hooks from @mirai-app/graphql-types require a GraphQLClient
 * instance from graphql-request as their first parameter.
 */
const createGraphQLClient = (): GraphQLClient => {
  // Get auth token from cookies
  const getAuthToken = (): string | null => {
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) =>
      c.trim().startsWith("sb-access-token="),
    );
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  return new GraphQLClient(env.graphqlUrl, {
    headers: () => {
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
};

export function TripProvider({ children }: TripProviderProps) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Create GraphQL client for use with generated hooks
  const client = useMemo(() => createGraphQLClient(), []);

  // Use the generated GraphQL hook to fetch trips
  // The hook returns data in a nested structure: data?.trips?.trips
  const { data, isLoading, error } = useGetTripsQuery(
    client,
    undefined, // No variables needed for basic trip list
    {
      staleTime: 30000, // 30 seconds
    },
  );

  // Extract trips array from the GraphQL response structure
  // GraphQL returns: data.trips.trips (the nested trips array inside a pagination wrapper)
  const trips = useMemo((): Trip[] => {
    const rawTrips = data?.trips?.trips ?? [];
    // Map the GraphQL trip fields to our local Trip interface
    return rawTrips.map((trip) => ({
      id: trip.id,
      name: trip.name,
    }));
  }, [data]);

  // Auto-select first trip if none selected and trips are available
  useEffect(() => {
    if (!selectedTrip && trips.length > 0) {
      const savedTripId = window.localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);
      const savedTrip = savedTripId
        ? trips.find((trip) => trip.id === savedTripId)
        : null;
      const fallbackTrip = trips[0] ?? null;
      setSelectedTrip(savedTrip ?? fallbackTrip);
    }
  }, [selectedTrip, trips]);

  const value: TripContextType = {
    selectedTrip,
    setSelectedTrip,
    trips,
    isLoading,
    error: error ?? null,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
}
