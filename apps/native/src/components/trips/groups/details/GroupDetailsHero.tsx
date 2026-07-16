import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, colors, glow, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface GroupDetailsHeroProps {
  name: string;
  imageUrl?: string | null;
}

export function GroupDetailsHero({ name, imageUrl }: GroupDetailsHeroProps) {
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View testID="group-details-hero" style={[styles.heroCard, glow(palette.primary)]}>
      <WoodTexture radius={borderRadius.xl} />
      {imageUrl ? (
        <>
          <CachedImage
            testID="group-hero-image"
            source={{ uri: imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroGradient} />
        </>
      ) : (
        <View style={styles.heroImagePlaceholder}>
          <Ionicons name="images-outline" size={40} color={palette.primary} />
          <Text style={styles.placeholderText}>No group image</Text>
        </View>
      )}

      <View style={styles.heroContent}>
        <Text style={styles.groupName}>{name}</Text>
      </View>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    heroCard: {
      position: "relative",
      height: 192,
      borderRadius: borderRadius.xl,
      backgroundColor: palette.cardDark,
      borderWidth: 1,
      borderColor: palette.primaryOpacity20,
      overflow: "hidden",
      marginBottom: spacing.lg,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroImagePlaceholder: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: "rgba(39, 41, 53, 0.9)",
    },
    placeholderText: {
      fontSize: typography.sm,
      fontWeight: typography.medium,
      color: palette.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    heroGradient: {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(23, 24, 28, 0.45)",
    },
    heroContent: {
      position: "absolute",
      left: spacing.xl,
      right: spacing.xl,
      bottom: spacing.lg,
      zIndex: 5,
    },
    groupName: {
      fontSize: 28,
      fontWeight: typography.bold,
      color: colors.white,
      letterSpacing: -0.4,
      lineHeight: 30,
    },
  });
}
