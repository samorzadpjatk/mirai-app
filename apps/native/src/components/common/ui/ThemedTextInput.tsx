import {
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface ThemedTextInputProps extends Omit<TextInputProps, "style"> {
  style?: StyleProp<TextStyle>;
  error?: boolean;
  testID?: string;
}

export function ThemedTextInput({
  style,
  error = false,
  testID = "themed-text-input",
  ...props
}: ThemedTextInputProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  return (
    <TextInput
      testID={testID}
      style={[styles.input, error && styles.inputError, style]}
      placeholderTextColor={palette.textTertiary}
      {...props}
    />
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    input: {
      backgroundColor: colors.backgroundDark,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.borderDark,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: typography.base,
      color: colors.white,
    },
    inputError: {
      borderColor: colors.danger,
    },
  });
}
