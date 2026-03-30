"use client";

import { useTrip } from "../../contexts/TripContext";
import { ActivityPage } from "./activity/ActivityPage";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorMessage } from "../ui/ErrorMessage";

export function Activity() {
  const { selectedTrip, isLoading } = useTrip();

  if (isLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  if (!selectedTrip) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  return <ActivityPage />;
}
