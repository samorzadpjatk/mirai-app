import { Image, StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface ChallengeDescriptionCardProps {
  description?: string | null;
  imageUrl?: string | null;
}

export function ChallengeDescriptionCard({
  description,
  imageUrl,
}: ChallengeDescriptionCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        {description ??
          "Complete this challenge to earn points for your group!"}
      </Text>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          testID="challenge-image"
          accessibilityLabel="Challenge image"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  description: {
    fontSize: typography.base,
    lineHeight: typography.base * 1.5,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
});
