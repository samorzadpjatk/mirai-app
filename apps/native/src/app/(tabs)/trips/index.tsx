import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@integral-2025-app/auth/client";
import LoadingScreen from "../../../components/LoadingScreen";
import { useSelectedTrip, useTrips } from "~/hooks/trips";
import TripDetailsScreen from "./details";
import { TripCard } from "~/components/trips/list/TripCard";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { colors, spacing, typography } from "~/styles";

export default function TripsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const insets = useAppSafeAreaInsets();
  const { trips, isLoading: tripsLoading } = useTrips();
  const { selectedTripId, isLoadingSelectedTrip, setSelectedTripId } = useSelectedTrip();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || isLoadingSelectedTrip || (!selectedTripId && tripsLoading)) {
    return <LoadingScreen message="Loading trip..." />;
  }

  if (!session) {
    return null;
  }

  if (selectedTripId) {
    return <TripDetailsScreen />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
      >
        <Text style={styles.title}>Choose your trip</Text>
        <Text style={styles.subtitle}>
          Select a trip to access maps, groups, challenges, and rewards.
        </Text>
        <View style={styles.list}>
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => setSelectedTripId(trip.id)}
            />
          ))}
        </View>
        {trips.length === 0 && (
          <Text style={styles.emptyText}>No trips available.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.base,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
