import { StyleSheet, Text, View } from "react-native";
import { typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface LeaderboardEmptyStateProps {
  message: string;
}

export function LeaderboardEmptyState({ message }: LeaderboardEmptyStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      color: palette.textMuted,
      fontSize: typography.lg,
    },
  });
}
