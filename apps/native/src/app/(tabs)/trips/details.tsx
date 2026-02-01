import { View, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTripDetails } from "~/hooks/trips";
import LoadingScreen from "../../../components/LoadingScreen";
import { colors, spacing } from "../../../styles";
import { TripHeroCard } from "~/components/trips/details/TripHeroCard";
import { TripNewsSection } from "~/components/trips/details/TripNewsSection";
import { TripNotFoundState } from "~/components/trips/details/TripNotFoundState";
import { TripQuickAccessGrid } from "~/components/trips/details/TripQuickAccessGrid";

export default function TripDetailsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.id === "string" ? params.id : params.id?.[0];

  const { isLoadingUser, trip, isLoadingTrip } = useTripDetails(tripId);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoadingUser || isLoadingTrip) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!session) {
    return null;
  }

  if (!trip) {
    return (
      <View style={styles.container}>
        <TripNotFoundState onGoBack={() => router.back()} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Main Content */}
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Hero Image */}
          <TripHeroCard
            name={trip.name}
            description={trip.description}
            startDate={trip.startDate}
            endDate={trip.endDate}
            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuByOUlLig-2IjrfVROMuWxtOKTaZJU93hKFSYG9rS9MpgZkPTGUYJ3ji7QskaEGx50eApLToqbB8SILw6jsYVnTOt8-DIr1oK0pDhGvd3n7kHjsvxVZdjn8uR-uqg3gGZ3xC1V0stUKkQ891sc4VqnGOUSw7VrMtyf4-hpwyAO6kcnRGCMk9TnoyO32RFtLjifjMyhRu_0Ez7YpR5KU2SJsYOcksKYeFIwnzmG2GRW9FOmhM2YCxvKA8nfCEDr7bgna-W6_OLyKsF0"
          />

          {/* Quick Access Grid */}
          <TripQuickAccessGrid
            onOpenGroups={() => router.push(`/trips/groups?tripId=${trip.id}`)}
            onOpenMap={() => router.push("/trips/map")}
            onOpenChallenges={() =>
              router.push(`/trips/challenges?tripId=${trip.id}`)
            }
            onOpenLeaderboard={() =>
              router.push(`/trips/leaderboard?tripId=${trip.id}`)
            }
            onOpenInfo={() => router.push("/trips/info")}
          />

          {/* Latest News Section */}
          <TripNewsSection />
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
    paddingBottom: spacing.xxxl,
  },
});
