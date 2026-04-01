"use client";

import { useTrip } from "../../contexts/TripContext";
import { SchedulesPage } from "./schedules/SchedulesPage";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function Schedules() {
  const { isLoading } = useTrip();

  if (isLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  return <SchedulesPage />;
}
