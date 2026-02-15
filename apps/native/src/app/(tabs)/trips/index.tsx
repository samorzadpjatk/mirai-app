import { View, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import LoadingScreen from "../../../components/LoadingScreen";
import { colors, spacing } from "../../../styles";
import { TripCard } from "~/components/trips/list/TripCard";
import { TripsEmptyState } from "~/components/trips/list/TripsEmptyState";
import { TripsHeader } from "~/components/trips/list/TripsHeader";
import { useTrips } from "~/hooks/trips";

export default function TripsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const insets = useAppSafeAreaInsets();
  const { trips, isLoading: tripsLoading } = useTrips();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || tripsLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingTop: insets.top + spacing.lg },
          ]}
        >
          <TripsHeader
            title="Your Trips"
            subtitle="Upcoming adventures & past memories"
          />

          {trips && trips.length > 0 ? (
            trips.map((trip) => {
              const isStaticTrip = trip.id === "wiatronalia-static";
              return (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  isStatic={isStaticTrip}
                  imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuByOUlLig-2IjrfVROMuWxtOKTaZJU93hKFSYG9rS9MpgZkPTGUYJ3ji7QskaEGx50eApLToqbB8SILw6jsYVnTOt8-DIr1oK0pDhGvd3n7kHjsvxVZdjn8uR-uqg3gGZ3xC1V0stUKkQ891sc4VqnGOUSw7VrMtyf4-hpwyAO6kcnRGCMk9TnoyO32RFtLjifjMyhRu_0Ez7YpR5KU2SJsYOcksKYeFIwnzmG2GRW9FOmhM2YCxvKA8nfCEDr7bgna-W6_OLyKsF0"
                  onPress={() => router.push(`/trips/details?id=${trip.id}`)}
                />
              );
            })
          ) : (
            <TripsEmptyState
              title="No trips yet"
              subtitle="Check back later for upcoming adventures"
            />
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
});
