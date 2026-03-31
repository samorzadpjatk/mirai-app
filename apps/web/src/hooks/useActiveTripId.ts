"use client";

import { useMemo } from "react";

export const ACTIVE_TRIP_STORAGE_KEY = "admin:selectedTripId";

export function useActiveTripId() {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const fromUrl = new URLSearchParams(window.location.search).get("tripId");
    if (fromUrl && fromUrl.trim().length > 0) {
      return fromUrl;
    }

    return window.localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY) ?? "";
  }, []);
}
