import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@integral-2025-app/trpc/client';
import { colors, spacing, borderRadius, typography } from '../../../styles';
import { TripPickerModal } from '~/components/common/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TripListItem } from '~/components/trips/list/types';

const PAGE_SIZE = 20;

interface TileType {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
  accentBg: string;
  route: string | null;
}

const tiles: TileType[] = [
  {
    key: 'users',
    title: 'Users',
    subtitle: 'Manage accounts',
    icon: 'people',
    accent: colors.primary,
    accentBg: colors.primaryOpacity10,
    route: '/admin/users',
  },
  {
    key: 'groups',
    title: 'Groups',
    subtitle: 'Teams & roles',
    icon: 'people-circle',
    accent: colors.slate400,
    accentBg: colors.cardDarkOpacity40,
    route: '/admin/groups',
  },
  {
    key: 'coins',
    title: 'Coins',
    subtitle: 'Currency & transactions',
    icon: 'cash',
    accent: colors.accentMagenta,
    accentBg: colors.magentaOpacity10,
    route: '/admin/coins',
  },
  {
    key: 'transactions',
    title: 'Transactions',
    subtitle: 'History & logs',
    icon: 'list',
    accent: colors.primary,
    accentBg: colors.primaryOpacity10,
    route: '/admin/transactions',
  },
  {
    key: 'notifications',
    title: 'Notifications',
    subtitle: 'Schedules & alerts',
    icon: 'notifications',
    accent: colors.accentMagenta,
    accentBg: colors.magentaOpacity10,
    route: '/admin/notifications',
  },
  {
    key: 'challenges',
    title: 'Challenges',
    subtitle: 'Points & tasks',
    icon: 'trophy',
    accent: colors.primary,
    accentBg: colors.primaryOpacity10,
    route: '/admin/challenges',
  },
  {
    key: 'rewards',
    title: 'Rewards',
    subtitle: 'Manage prizes',
    icon: 'gift',
    accent: colors.accentMagenta,
    accentBg: colors.magentaOpacity10,
    route: '/admin/rewards',
  },
  {
    key: 'activity',
    title: 'Activity',
    subtitle: 'Feed moderation',
    icon: 'pulse',
    accent: colors.slate400,
    accentBg: colors.cardDarkOpacity40,
    route: '/admin/activity',
  },
];

export default function AdminPanelScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const insets = useSafeAreaInsets();
  const [isTripPickerOpen, setIsTripPickerOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const {
    data,
    isLoading: tripsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      ...trpc.trip.getAll.queryOptions().queryKey,
      'infinite',
      PAGE_SIZE,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return trpcClient.trip.getAll.query({
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      });
    },
    getNextPageParam: (lastPage) => {
      const pagination =
        lastPage && typeof lastPage === 'object' && 'pagination' in lastPage
          ? lastPage.pagination
          : null;

      if (!pagination?.hasMore) {
        return undefined;
      }

      return pagination.offset + pagination.limit;
    },
  });

  const trips = useMemo(
    () =>
      (data?.pages ?? []).flatMap((page): TripListItem[] => {
        if (Array.isArray(page)) {
          return page as TripListItem[];
        }

        return (page as { trips?: TripListItem[] })?.trips ?? [];
      }),
    [data?.pages],
  );

  const effectiveTripId = selectedTripId ?? trips?.[0]?.id ?? null;

  const selectedTrip = useMemo(() => {
    if (!trips || !effectiveTripId) return null;
    return trips.find((trip) => trip.id === effectiveTripId) ?? null;
  }, [trips, effectiveTripId]);

  const handleTripPickerLoadMore = (event: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => {
    if (!hasNextPage || isFetchingNextPage || tripsLoading) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;

    if (nearBottom) {
      void fetchNextPage();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Quick access to admin tools</Text>
          <TouchableOpacity
            style={styles.tripPicker}
            onPress={() => setIsTripPickerOpen(true)}
            activeOpacity={0.85}
          >
            {tripsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.tripPickerText} numberOfLines={1}>
                  {selectedTrip?.name ?? 'Select trip'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tileGrid}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={styles.tile}
              activeOpacity={0.9}
              onPress={() => {
                if (!tile.route) {
                  Alert.alert('Coming soon', 'This section is not available yet.');
                  return;
                }

                if (!effectiveTripId) {
                  Alert.alert('Select trip', 'Choose a trip to manage before continuing.');
                  return;
                }

                router.push({
                  pathname: tile.route,
                  params: { tripId: effectiveTripId },
                });
              }}
            >
              <View style={[styles.tileIcon, { backgroundColor: tile.accentBg, borderColor: tile.accent }]}
              >
                <Ionicons name={tile.icon} size={24} color={tile.accent} />
              </View>
              <Text style={styles.tileTitle}>{tile.title}</Text>
              <Text style={styles.tileSubtitle}>{tile.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TripPickerModal
        visible={isTripPickerOpen}
        onClose={() => setIsTripPickerOpen(false)}
        onSelectTrip={(tripId) => {
          setSelectedTripId(tripId);
        }}
        trips={trips ?? []}
        selectedTripId={effectiveTripId}
        isLoading={tripsLoading}
        isFetchingMore={isFetchingNextPage}
        onLoadMore={handleTripPickerLoadMore}
      />
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    flex: 1,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    width: '47%',
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tileTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  tileSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  tripPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    maxWidth: 180,
  },
  tripPickerText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    flexShrink: 1,
  },
});
