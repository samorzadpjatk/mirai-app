import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSponsorById } from "~/hooks/sponsors/useSponsors";
import { usePartnerImageDownload } from "~/hooks/partners/usePartnerImageDownload";
import { borderRadius, colors, spacing, typography } from "~/styles";
import LoadingScreen from "~/components/LoadingScreen";

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: sponsor, isLoading, error } = useSponsorById(id ?? "");
  const { imageUrl } = usePartnerImageDownload(sponsor?.logoPath);

  if (isLoading) {
    return <LoadingScreen message="Loading sponsor..." />;
  }

  if (error || !sponsor) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Sponsor not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoWrapper}>
          <Image
            source={imageUrl ? { uri: imageUrl } : undefined}
            style={styles.logo}
          />
        </View>

        <Text style={styles.name}>{sponsor.name}</Text>

        <View style={styles.descriptionCard}>
          {sponsor.description.split("\n\n").map((paragraph) => (
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
