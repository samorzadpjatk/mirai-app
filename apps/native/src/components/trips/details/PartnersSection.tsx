import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "~/styles";
import aiseclabLogo from "../../../../assets/partners/aiseclab.png";
import orangeLogo from "../../../../assets/partners/orange.png";
import netcompanyLogo from "../../../../assets/partners/netcompany.png";
import comtegraLogo from "../../../../assets/partners/comtegra.png";

export interface Partner {
  id: string;
  name: string;
  logo: ImageSourcePropType;
  height?: number;
  offsetX?: number;
  offsetY?: number;
}

const PARTNERS: Partner[] = [
  {
    id: "partner-2",
    name: "AiSECLAB",
    logo: aiseclabLogo,
    height: 30,
  },
  {
    id: "partner-1",
    name: "Orange",
    logo: orangeLogo,
    height: 18,
  },
  {
    id: "partner-3",
    name: "Netcompany",
    logo: netcompanyLogo,
    offsetX: -5,
    offsetY: 3,
  },
  {
    id: "partner-4",
    name: "Comtegra",
    logo: comtegraLogo,
    offsetY: 3,
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
              style={[
                styles.logo,
                partner.height ? { height: partner.height } : undefined,
                partner.offsetX || partner.offsetY
                  ? {
                      transform: [
                        { translateX: partner.offsetX ?? 0 },
                        { translateY: partner.offsetY ?? 0 },
                      ],
                    }
                  : undefined,
              ]}
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
    overflow: "visible",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
