import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography, shadows } from "~/styles";

interface GroupDetailsHeroProps {
  name: string;
  imageUrl?: string | null;
}

export function GroupDetailsHero({
  name,
  imageUrl,
}: GroupDetailsHeroProps) {
  return (
    <View style={[styles.heroCard, shadows.primaryGlow]}>
      <View style={styles.heroImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroImagePlaceholder}>
            <Ionicons name="images-outline" size={40} color={colors.primary} />
            <Text style={styles.placeholderText}>No group image</Text>
          </View>
        )}
        <View style={styles.heroGradient} />
      </View>

      <View style={styles.heroContent}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTextSection}>
            <Text style={styles.groupName}>{name}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.2)",
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  heroImageContainer: {
    height: 192,
    position: "relative",
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
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(23, 24, 28, 0)",
  },
  heroContent: {
    padding: spacing.xl,
    marginTop: -48,
    position: "relative",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.lg,
  },
  heroTextSection: {
    flex: 1,
  },
  groupName: {
    fontSize: 28,
    fontWeight: typography.bold,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: -1,
    lineHeight: 28,
  },
});
