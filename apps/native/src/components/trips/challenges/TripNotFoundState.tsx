import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface TripNotFoundStateProps {
  message?: string;
}

export function TripNotFoundState({ message = "Trip not found" }: TripNotFoundStateProps) {
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
      backgroundColor: colors.backgroundDark,
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      color: palette.textMuted,
      fontSize: typography.lg,
    },
  });
}
