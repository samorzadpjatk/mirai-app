import { Ionicons } from "@expo/vector-icons";
import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

export function AccountInfoSection() {
  const userMyQueryOptions = orpc.user.getMy.queryOptions({ input: {} });
  const { data: currentUser } = useQuery(userMyQueryOptions);
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();

  const email = currentUser?.email;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Information</Text>

      <View testID="account-info-card" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="mail" size={20} color={palette.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.xs,
      fontWeight: typography.bold,
      color: palette.textMuted,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    infoCard: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: palette.primaryOpacity10,
      alignItems: "center",
      justifyContent: "center",
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: typography.xs,
      color: palette.textMuted,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: typography.base,
      fontWeight: typography.medium,
      color: colors.white,
    },
    divider: {
      height: 1,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      marginVertical: spacing.md,
    },
  });
}
