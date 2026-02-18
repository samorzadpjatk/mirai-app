import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { borderRadius, colors, spacing, typography } from "~/styles";

export interface Partner {
  id: string;
  name: string;
  logo: ReturnType<typeof require>;
}

// ---------------------------------------------------------------
// ZAMIEN PLACEHOLDERY NA PRAWDZIWE PLIKI .jpg:
//   1) Wrzuć pliki do: assets/partners/
//   2) Podmień require() poniżej na właściwy plik
//      np. require("../../../../assets/partners/partner1.jpg")
// ---------------------------------------------------------------
const PARTNERS: Partner[] = [
  {
    id: "partner-1",
    name: "Partner 1",
    logo: require("../../../../assets/partners/partner1.jpg"),
  },
  {
    id: "partner-2",
    name: "Partner 2",
    logo: require("../../../../assets/partners/partner2.jpg"),
  },
  {
    id: "partner-3",
    name: "Partner 3",
    logo: require("../../../../assets/partners/partner3.jpg"),
  },
];

export { PARTNERS };

export function PartnersSection() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Our Partners</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PARTNERS.map((partner) => (
          <TouchableOpacity
            key={partner.id}
            style={styles.partnerCard}
            activeOpacity={0.7}
            onPress={() =>
              router.push(`/trips/partners/${partner.id}` as const)
            }
          >
            <Image source={partner.logo} style={styles.partnerLogo} />
            <Text style={styles.partnerName} numberOfLines={1}>
              {partner.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 130;

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  partnerCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  partnerLogo: {
    width: CARD_WIDTH - spacing.md * 2,
    height: 70,
    borderRadius: borderRadius.sm,
    resizeMode: "contain",
    backgroundColor: colors.surfaceDark,
  },
  partnerName: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
