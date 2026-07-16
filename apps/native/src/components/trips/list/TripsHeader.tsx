import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface TripsHeaderProps {
  title: string;
  subtitle: string;
}

export function TripsHeader({ title, subtitle }: TripsHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    header: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: typography.xxxl,
      fontWeight: typography.bold,
      color: colors.white,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: typography.base,
      color: palette.textSecondary,
    },
  });
}
