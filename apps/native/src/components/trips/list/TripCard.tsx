import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import type { TripListItem } from "./types";
import { useTripBackgroundImageDownload } from "~/hooks/trips/useTripBackgroundImageDownload";

interface TripCardProps {
  trip: TripListItem;
  imageUrl?: string;
  onPress: () => void;
}

const formatDateRange = (startDate: Date | string, endDate: Date | string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
};

const getTripStatus = (startDate: Date | string, endDate: Date | string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now >= start && now <= end) return "Ongoing";
  if (now < start) return "Upcoming";
  return "Past";
};

export function TripCard({ trip, onPress }: TripCardProps) {
  const status = getTripStatus(trip.startDate, trip.endDate);
  const { imageUrl } = useTripBackgroundImageDownload(trip.backgroundImagePath);

  // Don't render the image background if no URL is available
  if (!imageUrl) {
    return (
      <TouchableOpacity
        style={[styles.tripCard, styles.tripCardNoImage]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.tripContent}>
          <View style={styles.badgeRow}>
            <View style={styles.tripBadge}>
              <Text style={styles.tripBadgeText}>{status}</Text>
            </View>
          </View>
          <Text style={styles.tripTitle}>{trip.name}</Text>
          {trip.description ? (
            <Text style={styles.tripSubtitle}>{trip.description}</Text>
          ) : null}
          <Text style={styles.tripDate}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </Text>
          {trip.groups && trip.groups.length > 0 && (
            <Text style={styles.tripGroups}>
              {trip.groups.length}{" "}
              {trip.groups.length === 1 ? "group" : "groups"}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.tripImageBackground}
        imageStyle={styles.tripImage}
      >
        <View style={styles.tripOverlay} />
        <View style={styles.tripContent}>
          <View style={styles.badgeRow}>
            <View style={styles.tripBadge}>
              <Text style={styles.tripBadgeText}>{status}</Text>
            </View>
          </View>
          <Text style={styles.tripTitle}>{trip.name}</Text>
          {trip.description ? (
            <Text style={styles.tripSubtitle}>{trip.description}</Text>
          ) : null}
          <Text style={styles.tripDate}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </Text>
          {trip.groups && trip.groups.length > 0 && (
            <Text style={styles.tripGroups}>
              {trip.groups.length}{" "}
              {trip.groups.length === 1 ? "group" : "groups"}
            </Text>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tripCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    overflow: "hidden",
  },
  tripCardNoImage: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    backgroundColor: colors.cardDark,
  },
  tripImageBackground: {
    width: "100%",
    minHeight: 180,
  },
  tripImage: {
    borderRadius: borderRadius.md,
  },
  tripOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(23, 24, 28, 0.7)",
  },
  tripContent: {
    padding: spacing.xl,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
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
});
