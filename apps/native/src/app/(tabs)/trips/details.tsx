import { View, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelectedTrip, useTripDetails } from "~/hooks/trips";
import LoadingScreen from "../../../components/LoadingScreen";
import { colors, spacing } from "../../../styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TripHeroCard } from "~/components/trips/details/TripHeroCard";
import { TripNewsSection } from "~/components/trips/details/TripNewsSection";
import { TripNotFoundState } from "~/components/trips/details/TripNotFoundState";
import { TripQuickAccessGrid } from "~/components/trips/details/TripQuickAccessGrid";
import { PartnersSection } from "~/components/trips/details/PartnersSection";
import { TripBanner } from "~/components/trips/TripBanner";
import { useTripSync } from "~/stores/tripStore";

export default function TripDetailsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const paramTripId = typeof params.id === "string" ? params.id : params.id?.[0];
  const { selectedTripId, isLoadingSelectedTrip } = useSelectedTrip();
  const tripId = selectedTripId ?? paramTripId;

  const { isLoadingUser, trip, isLoadingTrip, isTripPast } = useTripDetails(tripId);

  // Keep trip store in sync with current trip state
  useTripSync();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoadingUser || isLoadingTrip || isLoadingSelectedTrip) {
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
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingTop: insets.top + spacing.xs,
              paddingBottom: insets.bottom + spacing.xxxl + spacing.xxl,
            },
          ]}
        >
          {/* Hero Image */}
          <TripHeroCard
            name={trip.name}
            description={trip.description}
            startDate={trip.startDate}
            endDate={trip.endDate}
            backgroundImagePath={trip.backgroundImagePath}
          />

          {/* Trip Banner */}
          <TripBanner />

          {/* Partners */}
          <PartnersSection sponsors={trip.tripSponsors?.map(ts => ts.sponsor).filter(Boolean)} />

          {/* Quick Access Grid */}
          <TripQuickAccessGrid
            isTripPast={isTripPast}
            onOpenGroups={() => router.push(`/trips/groups?tripId=${trip.id}`)}
            onOpenMap={() => router.push("/trips/map")}
            onOpenChallenges={() =>
              router.push(`/trips/challenges?tripId=${trip.id}`)
            }
            onOpenRewards={() =>
              router.push(`/trips/rewards?tripId=${trip.id}`)
            }
            onOpenLeaderboard={() =>
              router.push(`/trips/leaderboard?tripId=${trip.id}`)
            }
            onOpenInfo={() => router.push(`/trips/info?tripId=${trip.id}`)}
          />

          {/* Latest News Section */}
          <TripNewsSection tripId={trip.id} />
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
    paddingBottom: 0,
  },
});
