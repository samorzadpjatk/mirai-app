import { useEffect, useMemo } from "react";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@integral-2025-app/auth/client";
import LoadingScreen from "../../../components/LoadingScreen";
import { useSelectedTrip, useTrips } from "~/hooks/trips";

export default function TripsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const { trips, isLoading: tripsLoading } = useTrips();
  const { selectedTripId, isLoadingSelectedTrip } = useSelectedTrip();

  const hasSelectedTrip = useMemo(() => {
    if (!selectedTripId) return false;
    return trips.some((trip) => trip.id === selectedTripId);
  }, [selectedTripId, trips]);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || tripsLoading || isLoadingSelectedTrip) {
    return <LoadingScreen message="Loading trip..." />;
  }

  if (!session) {
    return null;
  }

  if (hasSelectedTrip && selectedTripId) {
    return <Redirect href={`/trips/details?id=${selectedTripId}`} />;
  }

  return <Redirect href="/(tabs)/community" />;
}
