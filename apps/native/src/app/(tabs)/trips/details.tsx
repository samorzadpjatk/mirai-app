import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "@integral-2025-app/auth/client";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import LoadingScreen from "../../../components/LoadingScreen";
import { colors, spacing, borderRadius, typography, shadows, commonStyles } from "../../../styles";
import { useAppSafeAreaInsets } from '~/contexts/safeArea';

export default function TripDetailsScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const tripId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const { data: currentUser } = useQuery(
    trpc.user.getMy.queryOptions()
  );

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? '' }),
    enabled: !!tripId,
  });

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || tripLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!session) {
    return null;
  }

  if (!trip) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Trip not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.errorLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getTripStatus = (startDate: Date, endDate: Date) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now >= start && now <= end) return 'Ongoing Trip';
    if (now < start) return 'Upcoming Trip';
    return 'Past Trip';
  };

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
          <View style={styles.heroCard}>
            <View style={styles.heroGradient} />
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuByOUlLig-2IjrfVROMuWxtOKTaZJU93hKFSYG9rS9MpgZkPTGUYJ3ji7QskaEGx50eApLToqbB8SILw6jsYVnTOt8-DIr1oK0pDhGvd3n7kHjsvxVZdjn8uR-uqg3gGZ3xC1V0stUKkQ891sc4VqnGOUSw7VrMtyf4-hpwyAO6kcnRGCMk9TnoyO32RFtLjifjMyhRu_0Ez7YpR5KU2SJsYOcksKYeFIwnzmG2GRW9FOmhM2YCxvKA8nfCEDr7bgna-W6_OLyKsF0" }}
              style={styles.heroImage}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  {getTripStatus(trip.startDate, trip.endDate)}
                </Text>
              </View>
              <Text style={styles.heroTitle}>{trip.name}</Text>
              {trip.description && (
                <Text style={styles.heroSubtitle}>{trip.description}</Text>
              )}
            </View>
          </View>

          {/* Quick Access Grid */}
          <View style={styles.gridContainer}>
            {/* Groups Card */}
            <TouchableOpacity
              style={[styles.gridCard, styles.gridCardGlow]}
              onPress={() => router.push(`/trips/groups?tripId=${trip.id}`)}
            >
              <View style={styles.gridIconWrapper}>
                <Ionicons name="grid" size={24} color={colors.primary} />
              </View>
              <View style={styles.gridCardContent}>
                <Text style={styles.gridCardTitle}>Groups</Text>
                <Text style={styles.gridCardSubtitle}>Team Roster</Text>
              </View>
            </TouchableOpacity>

            {/* Map Card */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/trips/map')}
            >
              <View style={styles.gridIconWrapper}>
                <Ionicons name="map" size={24} color={colors.primary} />
              </View>
              <View style={styles.gridCardContent}>
                <Text style={styles.gridCardTitle}>Map</Text>
                <Text style={styles.gridCardSubtitle}>Trip Locations</Text>
              </View>
            </TouchableOpacity>

            {/* Challenges Card */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push(`/trips/challenges?tripId=${trip.id}`)}
            >
              <View style={styles.gridIconWrapper}>
                <Ionicons name="locate" size={24} color={colors.primary} />
              </View>
              <View style={styles.gridCardContent}>
                <Text style={styles.gridCardTitle}>Challenges</Text>
                <Text style={styles.gridCardSubtitle}>Daily Quests</Text>
              </View>
            </TouchableOpacity>

            {/* Leaderboard Card */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push(`/trips/leaderboard?tripId=${trip.id}`)}
            >
              <View style={styles.gridIconWrapper}>
                <Ionicons name="trophy" size={24} color={colors.primary} />
              </View>
              <View style={styles.gridCardContent}>
                <Text style={styles.gridCardTitle}>Leaderboard</Text>
                <Text style={styles.gridCardSubtitle}>Quest Rankings</Text>
              </View>
            </TouchableOpacity>

            {/* Trip Info Card - Full Width */}
            <TouchableOpacity
              style={styles.gridCardWide}
              onPress={() => router.push('/trips/info')}
            >
              <View style={styles.gridIconWrapperLarge}>
                <Ionicons name="information-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.gridCardContentWide}>
                <Text style={styles.gridCardTitle}>Trip Info</Text>
                <Text style={styles.gridCardSubtitle}>Schedules, documents & rules</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Latest News Section */}
          <View style={styles.newsSection}>
            <View style={styles.newsSectionHeader}>
              <Text style={styles.sectionTitle}>Latest News</Text>
              <Text style={styles.viewAllLink}>View All</Text>
            </View>

            <View style={styles.newsList}>
              {/* News Item 1 */}
              <View style={styles.newsItem}>
                <View style={[styles.newsIcon, styles.newsIconPrimary]}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                </View>
                <View style={styles.newsContent}>
                  <View style={styles.newsHeader}>
                    <Text style={styles.newsTitle}>Meeting at lobby in 15 mins</Text>
                    <Text style={styles.newsTime}>2m ago</Text>
                  </View>
                  <Text style={styles.newsDescription}>
                    Mandatory gathering for all students for the evening briefing.
                  </Text>
                </View>
              </View>

              {/* News Item 2 */}
              <View style={styles.newsItem}>
                <View style={[styles.newsIcon, styles.newsIconMagenta]}>
                  <Ionicons name="star" size={20} color={colors.accentMagenta} />
                </View>
                <View style={styles.newsContent}>
                  <View style={styles.newsHeader}>
                    <Text style={styles.newsTitle}>Group B wins the Scavenger Hunt!</Text>
                    <Text style={styles.newsTime}>1h ago</Text>
                  </View>
                  <Text style={styles.newsDescription}>
                    Congrats to the 'Snow Leopards' for finding all items in record time.
                  </Text>
                </View>
              </View>

              {/* News Item 3 */}
              <View style={styles.newsItem}>
                <View style={styles.newsIcon}>
                  <Ionicons name="restaurant" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.newsContent}>
                  <View style={styles.newsHeader}>
                    <Text style={styles.newsTitle}>Dinner menu updated</Text>
                    <Text style={styles.newsTime}>3h ago</Text>
                  </View>
                  <Text style={styles.newsDescription}>
                    Check the 'Trip Info' section for tonight's alpine dining choices.
                  </Text>
                </View>
              </View>
            </View>
          </View>
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

  // Hero Card
  heroCard: {
    position: "relative",
    height: 192,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    backgroundColor: colors.primaryOpacity20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(23, 24, 28, 0.6)",
    zIndex: 10,
  },
  heroContent: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    zIndex: 20,
  },
  heroBadge: {
    backgroundColor: colors.primaryOpacity20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: typography.xxxl + 6,
    fontWeight: typography.bold,
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.primaryOpacity80,
  },

  // Grid Cards
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  gridCard: {
    width: "48%",
    backgroundColor: colors.cardDark,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    gap: spacing.lg,
  },
  gridCardGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  gridCardWide: {
    width: "100%",
    backgroundColor: colors.cardDark,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  gridIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryOpacity10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gridIconWrapperLarge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryOpacity10,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    backgroundColor: colors.accentMagenta,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.cardDark,
  },
  gridCardContent: {
    gap: 2,
  },
  gridCardContentWide: {
    flex: 1,
    gap: 2,
  },
  gridCardTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    lineHeight: typography.lg * typography.tight,
  },
  gridCardSubtitle: {
    fontSize: typography.xs,
    color: colors.textTertiary,
  },

  // News Section
  newsSection: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  newsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  viewAllLink: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  newsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  newsItem: {
    backgroundColor: colors.cardDarkOpacity40,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    gap: spacing.lg,
  },
  newsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate800,
    alignItems: "center",
    justifyContent: "center",
  },
  newsIconPrimary: {
    backgroundColor: colors.primaryOpacity20,
  },
  newsIconMagenta: {
    backgroundColor: colors.magentaOpacity10,
  },
  newsContent: {
    flex: 1,
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  newsTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.white,
    flex: 1,
    marginRight: spacing.sm,
  },
  newsTime: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.slate500,
  },
  newsDescription: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    lineHeight: typography.xs * typography.relaxed,
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  errorText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  errorLink: {
    fontSize: typography.base,
    color: colors.primary,
    fontWeight: typography.bold,
  },
});
