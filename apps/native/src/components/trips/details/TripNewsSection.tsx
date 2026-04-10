import { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/graphql";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface TripNewsSectionProps {
  tripId: string;
}

interface AdminNewsItem {
  id: string;
  activityType: "custom";
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date | string;
  admin?: {
    firstName: string;
    lastName: string;
  } | null;
}

const formatRelativeTime = (value: Date | string) => {
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
};

const formatAdminName = (item: AdminNewsItem) => {
  const firstName = item.admin?.firstName?.trim();
  const lastName = item.admin?.lastName?.trim();
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full.length > 0 ? full : "Admin";
};

export function TripNewsSection({ tripId }: TripNewsSectionProps) {
  const trpc = useTRPC();
  const router = useRouter();

  const newsQuery = useQuery({
    ...trpc.activityFeed.getByTrip.queryOptions({
      tripId,
      page: 1,
      pageSize: 30,
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
        lastName: string;
      } | null;
    }[];

    return activities.filter(
      (activity): activity is AdminNewsItem =>
        activity.activityType === "custom",
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
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading admin news...</Text>
          </View>
        ) : null}

        {!newsQuery.isLoading && customNews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="megaphone-outline"
              size={18}
              color={colors.textSecondary}
            />
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
              <Ionicons name="megaphone" size={18} color={colors.primary} />
            </View>

            <View style={styles.newsContent}>
              <View style={styles.newsHeader}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                <Text style={styles.newsTime}>
                  {formatRelativeTime(item.createdAt)}
                </Text>
              </View>

              {item.description ? (
                <Text style={styles.newsDescription}>{item.description}</Text>
              ) : null}

              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.newsImage}
                  contentFit="cover"
                />
              ) : null}

              <Text style={styles.newsAuthor}>
                Added by {formatAdminName(item)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.primary,
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
    backgroundColor: colors.cardDarkOpacity40,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cardDarkOpacity40,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryOpacity20,
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
    color: colors.textTertiary,
    lineHeight: typography.xs * typography.relaxed,
  },
  newsAuthor: {
    marginTop: spacing.sm,
    fontSize: typography.xs,
    color: colors.textSecondary,
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
