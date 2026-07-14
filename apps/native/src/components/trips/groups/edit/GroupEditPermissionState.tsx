import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface GroupEditPermissionStateProps {
  message: string;
  onGoBack: () => void;
}

export function GroupEditPermissionState({ message, onGoBack }: GroupEditPermissionStateProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{message}</Text>
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
