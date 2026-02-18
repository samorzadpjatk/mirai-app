import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { PARTNERS } from "~/components/trips/details/PartnersSection";
import { borderRadius, colors, spacing, typography } from "~/styles";

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const partner = PARTNERS.find((p) => p.id === id);

  if (!partner) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Partner not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoWrapper}>
          <Image source={partner.logo} style={styles.logo} />
        </View>

        <Text style={styles.name}>{partner.name}</Text>

        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xxl,
  },
  logoWrapper: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    marginTop: spacing.lg,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  name: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.white,
    textAlign: "center",
  },
  descriptionCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    padding: spacing.lg,
    width: "100%",
  },
  description: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: typography.base * typography.relaxed,
  },
  notFound: {
    fontSize: typography.lg,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.xxxl,
  },
});
