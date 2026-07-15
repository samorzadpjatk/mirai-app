import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface GroupEditNotFoundStateProps {
  onGoBack: () => void;
}

export function GroupEditNotFoundState({ onGoBack }: GroupEditNotFoundStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Group not found</Text>
      <TouchableOpacity onPress={onGoBack}>
        <Text style={styles.linkText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      fontSize: typography.lg,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    linkText: {
      color: palette.primary,
      fontWeight: typography.bold,
    },
  });
