import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useAppSafeAreaInsets } from '~/contexts/safeArea';
import LoadingScreen from "../../../components/LoadingScreen";
import { colors, spacing, borderRadius, typography } from "../../../styles";

export default function TripsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const { data: currentUser } = useQuery(
    trpc.user.getMy.queryOptions()
  );

  const { data: trips, isLoading: tripsLoading } = useQuery(
    trpc.trip.getAll.queryOptions()
  );

  // Static trip to display at the end
  const wiatronaliaTrip = useMemo(() => ({
    id: 'wiatronalia-static',
    name: 'Wiatronalia',
    description: 'Majówka żeglarska PJATKxATAx...',
    startDate: new Date('2026-04-29'),
    endDate: new Date('2026-05-03'),
    groups: [],
  }), []);

  // Combine API trips with static trip
  const allTrips = useMemo(() => {
    const apiTrips = trips ?? [];
    return [...apiTrips, wiatronaliaTrip];
  }, [trips, wiatronaliaTrip]);

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

          {allTrips && allTrips.length > 0 ? (
            allTrips.map((trip) => {
              const status = getTripStatus(trip.startDate, trip.endDate);
              const isStaticTrip = trip.id === 'wiatronalia-static';
              return (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  onPress={() => !isStaticTrip && router.push(`/trips/details?id=${trip.id}`)}
                  disabled={isStaticTrip}
                  activeOpacity={isStaticTrip ? 1 : 0.7}
                >
                  <ImageBackground
                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuByOUlLig-2IjrfVROMuWxtOKTaZJU93hKFSYG9rS9MpgZkPTGUYJ3ji7QskaEGx50eApLToqbB8SILw6jsYVnTOt8-DIr1oK0pDhGvd3n7kHjsvxVZdjn8uR-uqg3gGZ3xC1V0stUKkQ891sc4VqnGOUSw7VrMtyf4-hpwyAO6kcnRGCMk9TnoyO32RFtLjifjMyhRu_0Ez7YpR5KU2SJsYOcksKYeFIwnzmG2GRW9FOmhM2YCxvKA8nfCEDr7bgna-W6_OLyKsF0" }}
                    style={styles.tripImageBackground}
                    imageStyle={styles.tripImage}
                  >
                    <View style={styles.tripOverlay} />
                    <View style={styles.tripContent}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                        <View style={styles.tripBadge}>
                          <Text style={styles.tripBadgeText}>{status}</Text>
                        </View>
                        {isStaticTrip && (
                          <View style={styles.registerBadge}>
                            <Text style={styles.registerBadgeText}>Zapisz się już teraz</Text>
                          </View>
                        )}
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
                    </View>
                  </ImageBackground>
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
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    overflow: 'hidden',
  },
  tripImageBackground: {
    width: '100%',
    minHeight: 180,
  },
  tripImage: {
    borderRadius: borderRadius.md,
  },
  tripOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 24, 28, 0.7)',
  },
  tripContent: {
    padding: spacing.xl,
  },
  tripBadge: {
    backgroundColor: colors.primaryOpacity20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    alignSelf: "flex-start",
  },
  tripBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  registerBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#059669',
    alignSelf: "flex-start",
  },
  registerBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
