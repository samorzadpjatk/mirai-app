import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface AppInfoFooterProps {
  versionLabel: string;
  copyrightLabel: string;
}

export function AppInfoFooter({ versionLabel, copyrightLabel }: AppInfoFooterProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.appInfo}>
      <Text style={styles.appInfoText}>{versionLabel}</Text>
      <Text style={styles.appInfoText}>{copyrightLabel}</Text>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    appInfo: {
      alignItems: "center",
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    appInfoText: {
      fontSize: typography.xs,
      color: palette.textMuted,
    },
  });
}
