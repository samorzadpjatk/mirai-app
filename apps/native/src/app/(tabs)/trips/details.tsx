import { View, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelectedTrip, useTripDetails } from "~/hooks/trips";
import LoadingScreen from "../../../components/LoadingScreen";
import { colors, spacing } from "../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { TripHeroCard } from "~/components/trips/details/TripHeroCard";
import { TripNewsSection } from "~/components/trips/details/TripNewsSection";
import { TripNotFoundState } from "~/components/trips/details/TripNotFoundState";
import { TripQuickAccessGrid } from "~/components/trips/details/TripQuickAccessGrid";
import { PartnersSection } from "~/components/trips/details/PartnersSection";

export default function TripDetailsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const insets = useAppSafeAreaInsets();
  const params = useLocalSearchParams();
  const paramTripId = typeof params.id === "string" ? params.id : params.id?.[0];
  const { selectedTripId, isLoadingSelectedTrip } = useSelectedTrip();
  const tripId = selectedTripId ?? paramTripId;

  const { isLoadingUser, trip, isLoadingTrip } = useTripDetails(tripId);

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

          {/* Partners */}
          <PartnersSection />

          {/* Quick Access Grid */}
          <TripQuickAccessGrid
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
            onOpenInfo={() => router.push("/trips/info")}
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
