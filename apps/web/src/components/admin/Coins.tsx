"use client";

import { useTrip } from "../../contexts/TripContext";
import { CoinsOverviewPage } from "./coins/CoinsOverviewPage";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function Coins() {
  const { isLoading } = useTrip();

  if (isLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  return <CoinsOverviewPage />;
}
