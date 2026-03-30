"use client";

import { useTrip } from "../../contexts/TripContext";
import { TransactionsPage } from "./transactions/TransactionsPage";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function Transactions() {
  const { isLoading } = useTrip();

  if (isLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  return <TransactionsPage />;
}
