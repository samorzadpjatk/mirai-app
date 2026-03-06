import {
  TextInput,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "~/styles";

interface ThemedTextInputProps extends Omit<TextInputProps, "style"> {
  style?: StyleProp<TextStyle>;
  error?: boolean;
}

export function ThemedTextInput({
  style,
  error = false,
  ...props
}: ThemedTextInputProps) {
  return (
    <TextInput
      style={[styles.input, error && styles.inputError, style]}
      placeholderTextColor={colors.textTertiary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    color: colors.white,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
