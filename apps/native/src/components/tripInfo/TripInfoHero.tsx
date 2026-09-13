import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface TripInfoHeroProps {
  /** Trip name, or the label of the hero resource when the trip is unknown. */
  title: string;
  /** Formatted trip date range; omitted when the trip dates are unknown. */
  subtitle?: string | null;
  /** Trip status badge ("Ongoing", "Upcoming", "Past"). */
  badge?: string | null;
  /** Storage path of the seeded hero image; omitted when the trip has none. */
  imageStoragePath?: string | null;
}

/**
 * Header card of the trip info screen. When no hero image has been seeded for
 * the trip the card degrades to a themed panel instead of borrowing an
 * unrelated stock photo.
 */
export function TripInfoHero({ title, subtitle, badge, imageStoragePath }: TripInfoHeroProps) {
  const styles = useThemedStyles(makeStyles);

  const content: ReactNode = (
    <>
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        {badge ? (
          <View testID="trip-info-hero-badge" style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>{badge}</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.heroTextContainer}>
          <Text testID="trip-info-hero-title" style={styles.heroTitle}>
            {title}
          </Text>
          {subtitle ? (
            <Text testID="trip-info-hero-subtitle" style={styles.heroSubtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );

  if (!imageStoragePath) {
    return (
      <View testID="trip-info-hero" style={[styles.heroCard, styles.heroCardPlain]}>
        {content}
      </View>
    );
  }

  return (
    <View testID="trip-info-hero" style={styles.heroCard}>
      <CachedImage
        testID="trip-info-hero-image"
        storagePath={imageStoragePath}
        transform="hero"
        style={styles.heroImage}
        contentFit="cover"
      />
      {content}
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    heroCard: {
      height: 192,
      borderRadius: borderRadius.xl,
      overflow: "hidden",
    },
    heroCardPlain: {
      backgroundColor: palette.cardDark,
      borderWidth: 1,
      borderColor: palette.primaryOpacity20,
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: borderRadius.xl,
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(23, 24, 28, 0.4)",
    },
    heroContent: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: "space-between",
    },
    liveBadge: {
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      alignSelf: "flex-start",
    },
    liveBadgeText: {
      fontSize: 10,
      fontWeight: typography.bold,
      color: colors.backgroundDark,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    heroTextContainer: {
      gap: spacing.xs,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: typography.bold,
      color: colors.white,
    },
    heroSubtitle: {
      fontSize: typography.xs,
      fontWeight: typography.medium,
      color: palette.primaryOpacity80,
    },
  });
