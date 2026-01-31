import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography, shadows } from "~/styles";

interface GroupDetailsHeroProps {
  code: string;
  name: string;
  imageUrl: string;
}

export function GroupDetailsHero({
  code,
  name,
  imageUrl,
}: GroupDetailsHeroProps) {
  return (
    <View style={[styles.heroCard, shadows.primaryGlow]}>
      <View style={styles.heroImageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroGradient} />
      </View>

      <View style={styles.heroContent}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTextSection}>
            <Text style={styles.squadLabel}>{code}</Text>
            <Text style={styles.groupName}>{name}</Text>
          </View>
          <View style={styles.shieldBadge}>
            <Ionicons name="shield" size={32} color={colors.primary} />
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
  squadLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  groupName: {
    fontSize: 28,
    fontWeight: typography.bold,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: -1,
    lineHeight: 28,
  },
  shieldBadge: {
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.3)",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
});
