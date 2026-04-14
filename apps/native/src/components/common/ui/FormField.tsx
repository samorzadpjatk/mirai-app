import { type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { YStack, Text } from "@mirai-app/ui";

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
    <YStack marginBottom="$lg" style={style}>
      <Text
        fontSize="$sm"
        fontWeight="600"
        color="$textSecondary"
        marginBottom="$xs"
      >
        {label}
        {required && <Text color="$danger"> *</Text>}
      </Text>
      {children}
      {hint && (
        <Text fontSize="$xs" color="$textTertiary" marginTop="$xs">
          {hint}
        </Text>
      )}
      {error && (
        <Text fontSize="$xs" color="$danger" marginTop="$xs">
          {error}
        </Text>
      )}
    </YStack>
  );
}
