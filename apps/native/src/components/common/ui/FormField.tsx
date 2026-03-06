import { type ReactNode } from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { colors, spacing, typography } from "~/styles";

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
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      {children}
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.danger,
  },
  hint: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: typography.xs,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
