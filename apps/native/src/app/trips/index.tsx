import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingScreen from "../../components/LoadingScreen";
import BottomMenu from "../../components/BottomMenu";
import { colors, spacing, borderRadius, typography } from "../../styles";

export default function TripsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const trpc = useTRPC();
  const insets = useSafeAreaInsets();

  const { data: currentUser } = useQuery(
    trpc.user.getMy.queryOptions()
  );

  const { data: trips, isLoading: tripsLoading } = useQuery(
    trpc.trip.getAll.queryOptions()
  );

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

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const getTripStatus = (startDate: Date, endDate: Date) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now >= start && now <= end) return 'Ongoing';
    if (now < start) return 'Upcoming';
    return 'Past';
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + spacing.lg }]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Your Trips</Text>
            <Text style={styles.subtitle}>Upcoming adventures & past memories</Text>
          </View>

          {trips && trips.length > 0 ? (
            trips.map((trip) => {
              const status = getTripStatus(trip.startDate, trip.endDate);
              return (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  onPress={() => router.push(`/trips/details?id=${trip.id}`)}
                >
                  <View style={styles.tripBadge}>
                    <Text style={styles.tripBadgeText}>{status}</Text>
                  </View>
                  <Text style={styles.tripTitle}>{trip.name}</Text>
                  {trip.description && (
                    <Text style={styles.tripSubtitle}>{trip.description}</Text>
                  )}
                  <Text style={styles.tripDate}>
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </Text>
                  {trip.groups && trip.groups.length > 0 && (
                    <Text style={styles.tripGroups}>
                      {trip.groups.length} {trip.groups.length === 1 ? 'group' : 'groups'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No trips yet</Text>
              <Text style={styles.emptyStateSubtext}>Check back later for upcoming adventures</Text>
            </View>
          )}
        </ScrollView>

        <BottomMenu activeTab="trips" />
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  tripCard: {
    backgroundColor: colors.cardDark,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
  },
  tripBadge: {
    backgroundColor: colors.primaryOpacity20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  tripBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  tripTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  tripSubtitle: {
    fontSize: typography.base,
    color: colors.primaryOpacity80,
    marginBottom: spacing.sm,
  },
  tripDate: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  tripGroups: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxxl * 2,
  },
  emptyStateText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
});
