import { Ionicons } from "@expo/vector-icons";
import type { Activity } from "@mirai-app/orpc";
import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface TripNewsSectionProps {
  tripId: string;
}

type AdminNewsItem = Extract<Activity, { activityType: "custom" }>;

export function formatRelativeTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes <= 30) return `${minutes}m ago`;

  const datePart = date.toLocaleDateString("pl-PL");
  const timePart = date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
}

export function formatAdminName(item: {
  admin: { firstName: string; lastName?: string } | null;
}): string {
  const firstName = item.admin?.firstName?.trim();
  const lastName = item.admin?.lastName?.trim();
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full.length > 0 ? full : "Admin";
}

export function TripNewsSection({ tripId }: TripNewsSectionProps) {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();

  const newsQuery = useQuery({
    ...orpc.activityFeed.getByTrip.queryOptions({
      input: {
        tripId,
        page: 1,
        pageSize: 30,
      },
    }),
    enabled: Boolean(tripId),
  });

  const customNews = useMemo(() => {
    const activities = (newsQuery.data?.activities ?? []) as {
      id: string;
      activityType: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      createdAt: Date | string;
      admin?: {
        firstName: string;
        lastName?: string;
      } | null;
    }[];

    return activities.filter(
      (activity): activity is AdminNewsItem => activity.activityType === "custom",
    );
  }, [newsQuery.data?.activities]);

  return (
    <View style={styles.newsSection}>
      <View style={styles.newsSectionHeader}>
        <Text style={styles.sectionTitle}>Latest News</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/community",
              params: { filter: "news" },
            })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.viewAllButtonText}>View all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.newsList}>
        {newsQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={styles.loadingText}>Loading admin news...</Text>
          </View>
        ) : null}

        {!newsQuery.isLoading && customNews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={18} color={palette.textSecondary} />
            <Text style={styles.emptyText}>No news yet.</Text>
          </View>
        ) : null}

        {customNews.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.newsItem}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/community",
                params: {
                  filter: "news",
                  focusActivityId: item.id,
                },
              })
            }
          >
            <View style={styles.newsIcon}>
              <Ionicons name="megaphone" size={18} color={palette.primary} />
            </View>

            <View style={styles.newsContent}>
              <View style={styles.newsHeader}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                <Text style={styles.newsTime}>{formatRelativeTime(item.createdAt)}</Text>
              </View>

              {item.description ? (
                <Text style={styles.newsDescription}>{item.description}</Text>
              ) : null}

              {item.imageUrl ? (
                <CachedImage
                  source={{ uri: item.imageUrl }}
                  style={styles.newsImage}
                  contentFit="cover"
                />
              ) : null}

              <Text style={styles.newsAuthor}>Added by {formatAdminName(item)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
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
    viewAllButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    viewAllButtonText: {
      color: palette.primary,
      fontSize: typography.xs,
      fontWeight: typography.bold,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    newsList: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    loadingState: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: palette.cardDarkOpacity40,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
    },
    loadingText: {
      color: palette.textSecondary,
      fontSize: typography.sm,
    },
    emptyState: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: palette.cardDarkOpacity40,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
    },
    emptyText: {
      color: palette.textSecondary,
      fontSize: typography.sm,
    },
    newsItem: {
      backgroundColor: palette.cardDarkOpacity40,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      flexDirection: "row",
      gap: spacing.lg,
    },
    newsIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.primaryOpacity20,
    },
    newsContent: {
      flex: 1,
    },
    newsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    newsTitle: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: colors.white,
      flex: 1,
    },
    newsTime: {
      fontSize: typography.xs,
      fontWeight: typography.medium,
      color: colors.slate500,
    },
    newsDescription: {
      fontSize: typography.xs,
      color: palette.textTertiary,
      lineHeight: typography.xs * typography.relaxed,
    },
    newsAuthor: {
      marginTop: spacing.sm,
      fontSize: typography.xs,
      color: palette.textSecondary,
    },
    newsImage: {
      width: "100%",
      height: 120,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.borderWhite10,
      marginTop: spacing.sm,
    },
  });
