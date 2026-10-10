import { StyleSheet, Text, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { borderRadius, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface TripHeroCardProps {
  name: string;
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

function buildImageSource(imageUrl?: string) {
  return imageUrl ? { uri: imageUrl } : null;
}

export function TripHeroCard({
  name,
  startDate,
  endDate,
  imageUrl,
  backgroundImagePath,
}: TripHeroCardProps) {
  const styles = useThemedStyles(makeStyles);
  const directSource = buildImageSource(imageUrl);
  const hasRemoteSource = Boolean(directSource) || Boolean(backgroundImagePath);

  if (!hasRemoteSource) {
    return (
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{getTripStatus(startDate, endDate)}</Text>
          </View>
          <Text style={styles.heroTitle}>{name}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroGradient} />
      <CachedImage
        source={directSource ?? undefined}
        storagePath={backgroundImagePath ?? undefined}
        transform="hero"
        style={styles.heroImage}
        contentFit="cover"
        contentPosition="center"
      />
      <View style={styles.heroContent}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{getTripStatus(startDate, endDate)}</Text>
        </View>
        <Text style={styles.heroTitle}>{name}</Text>
      </View>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    heroCard: {
      position: "relative",
      height: 192,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      marginHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      overflow: "hidden",
      backgroundColor: palette.primaryOpacity20,
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
      backgroundColor: palette.primaryOpacity20,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: palette.primaryOpacity30,
      alignSelf: "flex-start",
      marginBottom: spacing.sm,
    },
    heroBadgeText: {
      fontSize: typography.xs,
      fontWeight: typography.bold,
      color: palette.primary,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    heroTitle: {
      fontSize: typography.xxxl + 6,
      fontWeight: typography.bold,
      color: palette.white,
    },
  });
