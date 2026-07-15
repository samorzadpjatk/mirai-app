import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface AlertsHeaderProps {
  title: string;
  subtitle: string;
}

export function AlertsHeader({ title, subtitle }: AlertsHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    header: {
      marginBottom: spacing.xl,
    },
    headerTitle: {
      fontSize: typography.xxl,
      fontWeight: typography.bold,
      color: palette.white,
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      fontSize: typography.sm,
      color: palette.textMuted,
    },
  });
}
