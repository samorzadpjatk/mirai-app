import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function FormField({
  label,
  children,
  error,
  hint,
  required = false,
  style,
}: FormFieldProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View testID="form-field-container" style={[styles.container, style]}>
      <Text testID="form-field-label" style={styles.label}>
        {label}
        {required && (
          <Text testID="form-field-required" style={styles.required}>
            {" "}
            *
          </Text>
        )}
      </Text>
      {children}
      {hint ? (
        <Text testID="form-field-hint" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text testID="form-field-error" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: typography.sm,
      fontWeight: typography.semibold,
      color: palette.textSecondary,
      marginBottom: spacing.xs,
    },
    required: {
      color: palette.danger,
    },
    hint: {
      fontSize: typography.xs,
      color: palette.textTertiary,
      marginTop: spacing.xs,
    },
    error: {
      fontSize: typography.xs,
      color: palette.danger,
      marginTop: spacing.xs,
    },
  });
}
