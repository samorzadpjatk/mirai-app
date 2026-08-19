import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";
import miraiLogo from "../../../../assets/mirai_logo.png";
import type { TripListItem } from "./types";

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
  const styles = useThemedStyles(makeStyles);
  const status = getTripStatus(trip.startDate, trip.endDate);
  const isPast = status === "Past";
  const hasBackgroundImage = Boolean(trip.backgroundImagePath);

  // Don't render the image background if no URL is available
  if (!hasBackgroundImage) {
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
      <CachedImage
        storagePath={trip.backgroundImagePath ?? undefined}
        style={styles.tripImageBackground}
        contentFit="cover"
      />
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
    </TouchableOpacity>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    tripCard: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      overflow: "hidden",
    },
    pastTripCard: {
      opacity: 0.6,
    },
    tripCardNoImage: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      backgroundColor: palette.cardDark,
    },
    tripImageBackground: {
      position: "absolute",
      inset: 0,
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
      backgroundColor: palette.primaryOpacity20,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: palette.primaryOpacity30,
      alignSelf: "flex-start",
    },
    tripBadgeText: {
      fontSize: typography.xs,
      fontWeight: typography.bold,
      color: palette.primary,
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
      color: palette.primaryOpacity80,
      marginBottom: spacing.sm,
    },
    tripDate: {
      fontSize: typography.sm,
      color: palette.textTertiary,
      marginBottom: spacing.xs,
    },
    tripGroups: {
      fontSize: typography.sm,
      color: palette.textSecondary,
      fontWeight: typography.medium,
    },
  });
