import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "~/styles";

export interface Partner {
  id: string;
  name: string;
  logo: ReturnType<typeof require>;
  height?: number;
}

const PARTNERS: Partner[] = [
  {
    id: "partner-2",
    name: "AiSECLAB",
    logo: require("../../../../assets/partners/aiseclab.png"),
    height: 30,
  },
  {
    id: "partner-1",
    name: "Orange",
    logo: require("../../../../assets/partners/orange.png"),
    height: 18,
  },
  {
    id: "partner-3",
    name: "Netcompany",
    logo: require("../../../../assets/partners/netcompany.png"),
  },
  {
    id: "partner-4",
    name: "Comtegra",
    logo: require("../../../../assets/partners/comtegra.png"),
  },
];

export { PARTNERS };

export function PartnersSection() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Partners</Text>
      <View style={styles.row}>
        {PARTNERS.map((partner) => (
          <TouchableOpacity
            key={partner.id}
            style={styles.slot}
            activeOpacity={0.6}
            onPress={() =>
              router.push(`/trips/partners/${partner.id}` as const)
            }
          >
            <Image
            source={partner.logo}
            style={[styles.logo, partner.height ? { height: partner.height } : undefined]}
          />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: typography.xs - 1,
    fontWeight: typography.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: "100%",
  },
  slot: {
    flex: 1,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
