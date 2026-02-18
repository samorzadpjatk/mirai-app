import {
  Image,
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

const PARTNERS: Partner[] = [
  {
    id: "partner-1",
    name: "Orange",
    logo: require("../../../../assets/partners/partner1.jpg"),
  },
  {
    id: "partner-2",
    name: "AiSECLAB",
    logo: require("../../../../assets/partners/partner2.jpg"),
  },
  {
    id: "partner-3",
    name: "Netcompany",
    logo: require("../../../../assets/partners/partner3.jpg"),
  },
];

export { PARTNERS };

export function PartnersSection() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Our Partners</Text>

      <View style={styles.card}>
        {PARTNERS.map((partner) => (
          <TouchableOpacity
            key={partner.id}
            style={styles.partnerSlot}
            activeOpacity={0.7}
            onPress={() =>
              router.push(`/trips/partners/${partner.id}` as const)
            }
          >
            <Image source={partner.logo} style={styles.partnerLogo} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryOpacity10,
    padding: spacing.md,
  },
  partnerSlot: {
    flex: 1,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerLogo: {
    width: "75%",
    height: "100%",
    resizeMode: "contain",
  },
});
