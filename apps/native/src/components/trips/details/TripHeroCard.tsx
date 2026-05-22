import { Image, StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useTripBackgroundImageDownload } from "~/hooks/trips/useTripBackgroundImageDownload";

interface TripHeroCardProps {
  name: string;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  imageUrl?: string;
  backgroundImagePath?: string | null;
}

export const getTripStatus = (startDate: Date | string, endDate: Date | string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now >= start && now <= end) return "Ongoing Trip";
  if (now < start) return "Future Trip";
  return "Past Trip";
};

export function TripHeroCard({
  name,
  description,
  startDate,
  endDate,
  imageUrl,
  backgroundImagePath,
}: TripHeroCardProps) {
  const { imageUrl: backgroundImageUrl } = useTripBackgroundImageDownload(backgroundImagePath);
  const finalImageUrl = imageUrl ?? backgroundImageUrl ?? undefined;

  // Don't render the image if no URL is available
  if (!finalImageUrl) {
    return (
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{getTripStatus(startDate, endDate)}</Text>
          </View>
          <Text style={styles.heroTitle}>{name}</Text>
          {description ? <Text style={styles.heroSubtitle}>{description}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroGradient} />
      <Image source={{ uri: finalImageUrl }} style={styles.heroImage} />
      <View style={styles.heroContent}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{getTripStatus(startDate, endDate)}</Text>
        </View>
        <Text style={styles.heroTitle}>{name}</Text>
        {description ? <Text style={styles.heroSubtitle}>{description}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    position: "relative",
    height: 192,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
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
});
