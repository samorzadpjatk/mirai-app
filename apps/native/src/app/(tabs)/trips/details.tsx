import { useAuth } from "@mirai-app/auth/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeckBackground } from "~/components/common/DeckBackground";
import { TripBanner } from "~/components/trips/TripBanner";
import { PartnersSection, toPartners } from "~/components/trips/details/PartnersSection";
import { TripHeroCard } from "~/components/trips/details/TripHeroCard";
import { TripNewsSection } from "~/components/trips/details/TripNewsSection";
import { TripNotFoundState } from "~/components/trips/details/TripNotFoundState";
import { TripQuickAccessGrid } from "~/components/trips/details/TripQuickAccessGrid";
import { useSelectedTrip, useTripDetails } from "~/hooks/trips";
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

  const { trip, isLoadingTrip, isTripPast } = useTripDetails(tripId);

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

  const sponsors = toPartners(trip.tripSponsors);

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <DeckBackground />
        {/* Main Content */}
        <ScrollView
          style={[styles.mainContent, styles.contentAboveDeck]}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingTop: insets.top + spacing.xs,
              paddingBottom: 96,
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
          <PartnersSection sponsors={sponsors} />

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
  // Keep content strictly above the deck background (defensive z-order so
  // the hero/tiles never get covered by the absolute-fill background image).
  contentAboveDeck: {
    zIndex: 1,
  },
  contentContainer: {
    paddingBottom: 0,
  },
});
