"use client";

import { useTrip } from "../../contexts/TripContext";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { IoChevronDown } from "react-icons/io5";
import { useEffect } from "react";
import { ACTIVE_TRIP_STORAGE_KEY } from "../../hooks/useActiveTripId";

export function TripSwitcher() {
  const { selectedTrip, setSelectedTrip, trips, isLoading, error } = useTrip();

  useEffect(() => {
    if (selectedTrip?.id) {
      window.localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, selectedTrip.id);
    }
  }, [selectedTrip?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <LoadingSpinner label="Loading trips..." />
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-danger">Error loading trips</div>;
  }

  if (trips.length === 0) {
    return (
      <div className="text-sm text-text-secondary">No trips available</div>
    );
  }

  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tripId = e.target.value;
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      setSelectedTrip(trip);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="trip-select"
        className="text-sm font-medium text-text-secondary"
      >
        Trip:
      </label>
      <div className="relative">
        <select
          id="trip-select"
          value={selectedTrip?.id ?? ""}
          onChange={handleTripChange}
          className="appearance-none rounded-full border border-border bg-card py-1.5 pl-3 pr-8 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.name}
            </option>
          ))}
        </select>
        <IoChevronDown
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-primary"
          size={16}
        />
      </div>
    </div>
  );
}
