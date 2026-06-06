import { orpc } from "@mirai-app/orpc/client";
import { formatDisplayName, getInitials } from "@mirai-app/shared/users";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorState } from "~/components/common/ui";
import { HouseMemberList } from "~/components/trips/house/HouseMemberList";
import { useTripDetails } from "~/hooks/trips";
import { colors, spacing } from "../../../styles";

export default function MyHouseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const paramTripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  const { tripId: selectedTripId } = useTripDetails();
  const tripId = paramTripId ?? selectedTripId;

  const { data: currentUser } = useQuery(orpc.user.getMy.queryOptions({ input: {} }));

  const {
    data: houseMates,
    isLoading: houseMatesLoading,
    isError: isHouseMatesError,
    error: houseMatesError,
  } = useQuery({
    ...orpc.user.getMyHouseMates.queryOptions({
      input: { tripId: tripId ?? "" },
    }),
    enabled: !!tripId,
  });

  if (houseMatesLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your house...</Text>
        </View>
      </View>
    );
  }

  if (isHouseMatesError) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ErrorState
          title="Failed to load house information"
          message={houseMatesError?.message ?? "Something went wrong"}
        />
      </View>
    );
  }

  if (!houseMates) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No House Assigned</Text>
          <Text style={styles.emptySubtitle}>
            You haven't been assigned to a house for this trip yet.
          </Text>
        </View>
      </View>
    );
  }

  const memberList = houseMates.mates.map((mate) => ({
    id: mate.id,
    name: formatDisplayName(mate.firstName, mate.lastName) ?? "Unknown User",
    initials: getInitials(mate.firstName, mate.lastName),
    isCurrentUser: mate.id === currentUser?.id,
    avatarStoragePath: null,
    wristNumber: mate.wristNumber,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HouseMemberList members={memberList} houseNumber={houseMates.houseNumber} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});
