import { StyleSheet, Text, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface ChallengeDescriptionCardProps {
  description?: string | null;
  imageUrl?: string | null;
}

export function ChallengeDescriptionCard({ description, imageUrl }: ChallengeDescriptionCardProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <WoodTexture radius={borderRadius.xl} />
      <Text style={styles.description}>
        {description ?? "Complete this challenge to earn points for your group!"}
      </Text>
      {imageUrl ? (
        <CachedImage
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          testID="challenge-image"
          accessibilityLabel="Challenge image"
        />
      ) : null}
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
    },
    description: {
      fontSize: typography.base,
      lineHeight: typography.base * 1.5,
      color: palette.textSecondary,
      marginBottom: spacing.lg,
    },
    image: {
      width: "100%",
      aspectRatio: 16 / 9,
      borderRadius: borderRadius.lg,
      marginTop: spacing.md,
    },
  });
}
