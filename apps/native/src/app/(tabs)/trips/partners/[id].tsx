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
          {partner.description.split("\n\n").map((paragraph) => (
            <Text key={paragraph} style={styles.description}>
              {paragraph}
            </Text>
          ))}
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
    paddingBottom: spacing.xxxl * 4,
    alignItems: "center",
    gap: spacing.xxl,
  },
  logoWrapper: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  logo: {
    width: "100%",
    height: "100%",
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
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  description: {
    fontSize: typography.lg,
    color: colors.white,
    textAlign: "center",
    lineHeight: typography.lg * typography.relaxed,
  },
  notFound: {
    fontSize: typography.lg,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.xxxl,
  },
});
