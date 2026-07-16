import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

function PartnerLogo({ sponsor }: { sponsor: Partner }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <CachedImage
      testID="partner-logo"
      storagePath={sponsor.logoPath}
      style={[
        styles.logo,
        sponsor.height ? { height: sponsor.height } : undefined,
        sponsor.offsetX || sponsor.offsetY
          ? {
              transform: [
                { translateX: sponsor.offsetX ?? 0 },
                { translateY: sponsor.offsetY ?? 0 },
              ],
            }
          : undefined,
      ]}
      contentFit="contain"
    />
  );
}

export interface Partner {
  id: string;
  name: string;
  logoPath: string;
  description: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
}

interface PartnersSectionProps {
  sponsors?: Partner[];
}

export function PartnersSection({ sponsors }: PartnersSectionProps) {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Partners</Text>
      <View style={styles.row}>
        {sponsors.map((sponsor) => (
          <TouchableOpacity
            key={sponsor.id}
            style={styles.slot}
            activeOpacity={0.6}
            onPress={() => router.push(`/trips/partners/${sponsor.id}` as const)}
          >
            <PartnerLogo sponsor={sponsor} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
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
      color: palette.textMuted,
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
}
