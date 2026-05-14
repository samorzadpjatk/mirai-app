import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import miraiLogo from "../../../../assets/mirai_logo.png";
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
  const isPast = status === "Past";

  // Don't render the image background if no URL is available
  if (!imageUrl) {
    return (
      <TouchableOpacity
        style={[styles.tripCard, styles.tripCardNoImage, isPast && styles.pastTripCard]}
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
          {trip.description ? <Text style={styles.tripSubtitle}>{trip.description}</Text> : null}
          <Text style={styles.tripDate}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
          {trip.groups && trip.groups.length > 0 && (
            <Text style={styles.tripGroups}>
              {trip.groups.length} {trip.groups.length === 1 ? "group" : "groups"}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.tripCard, isPast && styles.pastTripCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.tripImageBackground}
        imageStyle={styles.tripImage}
      >
        <View style={styles.tripOverlay} />
        <View style={styles.tripLogoBadge}>
          <Image source={miraiLogo} style={styles.tripLogo} contentFit="contain" />
        </View>
        <View style={styles.tripContent}>
          <View style={styles.badgeRow}>
            <View style={styles.tripBadge}>
              <Text style={styles.tripBadgeText}>{status}</Text>
            </View>
          </View>
          <Text style={styles.tripTitle}>{trip.name}</Text>
          {trip.description ? <Text style={styles.tripSubtitle}>{trip.description}</Text> : null}
          <Text style={styles.tripDate}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
          {trip.groups && trip.groups.length > 0 && (
            <Text style={styles.tripGroups}>
              {trip.groups.length} {trip.groups.length === 1 ? "group" : "groups"}
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
  pastTripCard: {
    opacity: 0.6,
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
  tripLogoBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  tripLogo: {
    width: 28,
    height: 28,
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
