"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { useGetTripsQuery } from "@mirai-app/frameworks/graphql/urql";
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

export function TripProvider({ children }: TripProviderProps) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Use urql hook to fetch trips
  // The hook returns data in a nested structure: data?.trips?.trips
  const [{ data, fetching, error }] = useGetTripsQuery({
    requestPolicy: "cache-and-network",
  });

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
    isLoading: fetching,
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
