import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "~/styles";

interface AppInfoFooterProps {
  versionLabel: string;
  copyrightLabel: string;
}

export function AppInfoFooter({ versionLabel, copyrightLabel }: AppInfoFooterProps) {
  return (
    <View style={styles.appInfo}>
      <Text style={styles.appInfoText}>{versionLabel}</Text>
      <Text style={styles.appInfoText}>{copyrightLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appInfo: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  appInfoText: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
});
