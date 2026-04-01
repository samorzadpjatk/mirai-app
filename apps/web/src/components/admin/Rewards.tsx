"use client";

import { useTrip } from "../../contexts/TripContext";
import { RewardsPage } from "./rewards/RewardsPage";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorMessage } from "../ui/ErrorMessage";

export function Rewards() {
  const { selectedTrip, isLoading } = useTrip();

  if (isLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  if (!selectedTrip) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  return <RewardsPage />;
}
