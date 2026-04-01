"use client";

import { useTrip } from "../../contexts/TripContext";
import { NotificationsPage } from "./notifications/NotificationsPage";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorMessage } from "../ui/ErrorMessage";

export function Notifications() {
  const { selectedTrip, isLoading } = useTrip();

  if (isLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  if (!selectedTrip) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  return <NotificationsPage />;
}
