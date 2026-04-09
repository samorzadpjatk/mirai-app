"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAdminTrips } from "@mirai-app/frameworks/trpc/hooks";
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
  const { trips, isLoading } = useAdminTrips();

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
    error: null,
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
