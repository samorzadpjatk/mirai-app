import { useAuth } from "@mirai-app/auth/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TripBanner } from "~/components/trips/TripBanner";
import { type Partner, PartnersSection } from "~/components/trips/details/PartnersSection";
import { TripHeroCard } from "~/components/trips/details/TripHeroCard";
import { TripNewsSection } from "~/components/trips/details/TripNewsSection";
import { TripNotFoundState } from "~/components/trips/details/TripNotFoundState";
import { TripQuickAccessGrid } from "~/components/trips/details/TripQuickAccessGrid";
import { useSelectedTrip, useTripByIdFull } from "~/hooks/trips";
import { useTripSync } from "~/stores/tripStore";
import LoadingScreen from "../../../components/LoadingScreen";
import { colors, spacing } from "../../../styles";

export default function TripDetailsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const paramTripId = typeof params.id === "string" ? params.id : params.id?.[0];
  const { selectedTripId, isLoadingSelectedTrip } = useSelectedTrip();
  const tripId = selectedTripId ?? paramTripId;

  const { trip, isLoadingTrip, isTripPast } = useTripByIdFull(tripId);

  // Keep trip store in sync with current trip state
  useTripSync();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || isLoadingTrip || isLoadingSelectedTrip) {
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
          <PartnersSection
            sponsors={
              trip.tripSponsors?.map((ts) => ts.sponsor).filter(Boolean) as unknown as Partner[]
            }
          />

          {/* Quick Access Grid */}
          <TripQuickAccessGrid
            isTripPast={isTripPast}
            onOpenGroups={() => router.push(`/trips/groups?tripId=${trip.id}`)}
            onOpenMap={() => router.push("/trips/map")}
            onOpenChallenges={() => router.push(`/trips/challenges?tripId=${trip.id}`)}
            onOpenRewards={() => router.push(`/trips/rewards?tripId=${trip.id}`)}
            onOpenLeaderboard={() => router.push(`/trips/leaderboard?tripId=${trip.id}`)}
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
