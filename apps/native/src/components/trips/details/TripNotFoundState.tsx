import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface TripNotFoundStateProps {
  onGoBack: () => void;
}

export function TripNotFoundState({ onGoBack }: TripNotFoundStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Trip not found</Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text style={styles.errorLink}>Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xxl,
    },
    errorText: {
      fontSize: typography.xl,
      fontWeight: typography.bold,
      color: colors.white,
      marginBottom: spacing.md,
    },
    errorLink: {
      fontSize: typography.base,
      color: palette.primary,
      fontWeight: typography.bold,
    },
  });
