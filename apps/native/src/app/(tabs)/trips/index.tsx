import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { useAuth } from "@mirai-app/frameworks/auth/client";
import LoadingScreen from "../../../components/LoadingScreen";
import { useSelectedTrip, useTrips } from "~/hooks/trips";
import TripDetailsScreen from "./details";
import { TripCard } from "~/components/trips/list/TripCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text } from "@mirai-app/ui";

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
    refetch,
  } = useTrips();
  const { selectedTripId, isLoadingSelectedTrip, setSelectedTripId } =
    useSelectedTrip();

  const handleScrollLoadMore = (event: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => {
    if (!hasNextPage || isFetchingNextPage || tripsLoading) return;

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;

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

  if (!session) {
    return null;
  }

  if (selectedTripId) {
    return <TripDetailsScreen />;
  }

  return (
    <YStack flex={1} backgroundColor="$backgroundDark">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        onScroll={handleScrollLoadMore}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => {
              void refetch();
            }}
            tintColor="#00ced1"
          />
        }
      >
        <Text fontSize="$5" fontWeight="700" color="white">
          Choose your trip
        </Text>
        <Text fontSize="$3" color="$textSecondary" marginBottom="$3">
          Select a trip to access maps, groups, challenges, and rewards.
        </Text>
        <YStack gap="$3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => setSelectedTripId(trip.id)}
            />
          ))}
        </YStack>
        {trips.length === 0 && (
          <Text
            color="$textSecondary"
            fontSize="$3"
            textAlign="center"
            marginTop="$4"
          >
            No trips available.
          </Text>
        )}

        {isFetchingNextPage ? (
          <XStack
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            gap="$2"
            marginTop="$3"
          >
            <ActivityIndicator size="small" color="#00ced1" />
            <Text color="$textSecondary" fontSize="$2">
              Loading more trips...
            </Text>
          </XStack>
        ) : null}
      </ScrollView>
    </YStack>
  );
}
