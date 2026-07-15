import { useAuth } from "@mirai-app/auth/client";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorState } from "~/components/common/ui";
import { TripCard } from "~/components/trips/list/TripCard";
import { useSelectedTrip, useTrips } from "~/hooks/trips";
import { colors, spacing, typography } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";
import LoadingScreen from "../../../components/LoadingScreen";
import TripDetailsScreen from "./details";

export default function TripsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    trips,
    isLoading: tripsLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useTrips();
  const { selectedTripId, isLoadingSelectedTrip, setSelectedTripId } = useSelectedTrip();
  const { palette } = useTripTheme();

  const handleScrollLoadMore = (event: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => {
    if (!hasNextPage || isFetchingNextPage || tripsLoading) return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;

    if (nearBottom) {
      void fetchNextPage();
    }
  };

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || isLoadingSelectedTrip || (!selectedTripId && tripsLoading)) {
    return <LoadingScreen message="Loading trip..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load trips"
        message={error?.message ?? "Something went wrong"}
        onRetry={() => void refetch()}
      />
    );
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
            paddingBottom: 96,
          },
        ]}
        onScroll={handleScrollLoadMore}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={palette.primary}
          />
        }
      >
        <Text style={styles.title}>Choose your trip</Text>
        <Text style={styles.subtitle}>
          Select a trip to access maps, groups, challenges, and rewards.
        </Text>
        <View style={styles.list}>
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => setSelectedTripId(trip.id)} />
          ))}
        </View>
        {trips.length === 0 ? <Text style={styles.emptyText}>No trips available.</Text> : null}

        {isFetchingNextPage ? (
          <View style={styles.listFooter}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={styles.listFooterText}>Loading more trips...</Text>
          </View>
        ) : null}
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
  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  listFooterText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
});
