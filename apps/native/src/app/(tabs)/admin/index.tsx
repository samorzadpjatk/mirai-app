import { Ionicons } from "@expo/vector-icons";
import { orpc } from "@mirai-app/orpc/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type React from "react";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeckBackground } from "~/components/common/DeckBackground";
import { TripPickerModal } from "~/components/common/ui";
import type { TripListItem } from "~/components/trips/list/types";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import plankPanel from "../../../../assets/textures/plank-panel.png";
import { borderRadius, spacing, typography } from "../../../styles";

const PAGE_SIZE = 20;

interface TileType {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  accentBg: string;
  route: string | null;
}

function makeTiles(palette: ThemePalette): TileType[] {
  return [
    {
      key: "users",
      title: "Users",
      subtitle: "Manage accounts",
      icon: "people",
      accent: palette.primary,
      accentBg: palette.primaryOpacity10,
      route: "/admin/users",
    },
    {
      key: "groups",
      title: "Groups",
      subtitle: "Teams & roles",
      icon: "people-circle",
      accent: palette.slate400,
      accentBg: palette.cardDarkOpacity40,
      route: "/admin/groups",
    },
    {
      key: "rooms",
      title: "Rooms",
      subtitle: "Accommodation & occupancy",
      icon: "bed",
      accent: palette.primary,
      accentBg: palette.cardDarkOpacity40,
      route: "/admin/rooms",
    },
    {
      key: "coins",
      title: "Coins",
      subtitle: "Currency & transactions",
      icon: "cash",
      accent: palette.accentMagenta,
      accentBg: palette.magentaOpacity10,
      route: "/admin/coins",
    },
    {
      key: "transactions",
      title: "Transactions",
      subtitle: "History & logs",
      icon: "list",
      accent: palette.primary,
      accentBg: palette.primaryOpacity10,
      route: "/admin/transactions",
    },
    {
      key: "notifications",
      title: "Notifications",
      subtitle: "Schedules & alerts",
      icon: "notifications",
      accent: palette.accentMagenta,
      accentBg: palette.magentaOpacity10,
      route: "/admin/notifications",
    },
    {
      key: "challenges",
      title: "Challenges",
      subtitle: "Points & tasks",
      icon: "trophy",
      accent: palette.primary,
      accentBg: palette.primaryOpacity10,
      route: "/admin/challenges",
    },
    {
      key: "rewards",
      title: "Rewards",
      subtitle: "Manage prizes",
      icon: "gift",
      accent: palette.accentMagenta,
      accentBg: palette.magentaOpacity10,
      route: "/admin/rewards",
    },
    {
      key: "activity",
      title: "Activity",
      subtitle: "Feed moderation",
      icon: "pulse",
      accent: palette.slate400,
      accentBg: palette.cardDarkOpacity40,
      route: "/admin/activity",
    },
  ];
}

export default function AdminPanelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isTripPickerOpen, setIsTripPickerOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const styles = useThemedStyles(makeStyles);
  const { palette, themeKey } = useTripTheme();
  const isPirate = themeKey === "PIRATE";
  const tiles = useMemo(() => makeTiles(palette), [palette]);

  const {
    data,
    isLoading: tripsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    orpc.trip.getAll.infiniteOptions({
      input: (pageParam: number) => {
        const offset = typeof pageParam === "number" ? pageParam : 0;
        return {
          pagination: {
            limit: PAGE_SIZE,
            offset,
          },
        };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pagination =
          lastPage && typeof lastPage === "object" && "pagination" in lastPage
            ? lastPage.pagination
            : null;

        if (!pagination?.hasMore) {
          return undefined;
        }

        return pagination.offset + pagination.limit;
      },
    }),
  );

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

  const effectiveTripId = selectedTripId || (trips?.[0]?.id ?? null);

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
    const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;

    if (nearBottom) {
      void fetchNextPage();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <DeckBackground />

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
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <>
                <Text style={styles.tripPickerText} numberOfLines={1}>
                  {selectedTrip?.name ?? "Select trip"}
                </Text>
                <Ionicons name="chevron-down" size={16} color={palette.primary} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tileGrid}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={[styles.tile, isPirate && styles.tilePirate]}
              activeOpacity={0.9}
              onPress={() => {
                if (!tile.route) {
                  Alert.alert("Coming soon", "This section is not available yet.");
                  return;
                }

                if (!effectiveTripId) {
                  Alert.alert("Select trip", "Choose a trip to manage before continuing.");
                  return;
                }

                router.push({
                  pathname: tile.route,
                  params: { tripId: effectiveTripId },
                });
              }}
            >
              {isPirate ? (
                <Image
                  source={plankPanel}
                  style={styles.panel}
                  contentFit="fill"
                  pointerEvents="none"
                />
              ) : null}
              <View
                style={[
                  styles.tileIcon,
                  { backgroundColor: tile.accentBg, borderColor: tile.accent },
                ]}
              >
                <Ionicons name={tile.icon} size={24} color={tile.accent} />
              </View>
              <Text style={[styles.tileTitle, isPirate && styles.tileTitlePirate]}>
                {tile.title}
              </Text>
              <Text style={[styles.tileSubtitle, isPirate && styles.tileSubtitlePirate]}>
                {tile.subtitle}
              </Text>
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

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 96,
    },
    header: {
      marginBottom: spacing.xl,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    title: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: palette.white,
      flex: 1,
    },
    tileGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    tile: {
      width: "47%",
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: palette.borderWhite5,
    },
    // Pirate: the wooden plank panel image provides the surface + frame, so drop
    // the flat card fill/border and let its transparent corners reveal the deck.
    tilePirate: {
      backgroundColor: "transparent",
      borderWidth: 0,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      minHeight: 120,
    },
    panel: {
      ...StyleSheet.absoluteFillObject,
    },
    tileIcon: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      marginBottom: spacing.md,
    },
    tileTitle: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: palette.white,
      marginBottom: spacing.xs,
    },
    tileTitlePirate: {
      textShadowColor: "rgba(0, 0, 0, 0.65)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    tileSubtitle: {
      fontSize: typography.sm,
      color: palette.textSecondary,
    },
    tileSubtitlePirate: {
      textShadowColor: "rgba(0, 0, 0, 0.6)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    tripPicker: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: palette.cardDark,
      borderWidth: 1,
      borderColor: palette.borderDark,
      maxWidth: 180,
    },
    tripPickerText: {
      color: palette.white,
      fontSize: typography.sm,
      fontWeight: typography.medium,
      flexShrink: 1,
    },
  });
}
