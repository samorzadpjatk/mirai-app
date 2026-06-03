import type { ReactNode } from "react";
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import { borderRadius, colors, spacing } from "~/styles";

interface ThemedCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  bordered?: boolean;
  selected?: boolean;
  variant?: "default" | "interactive";
}

export function ThemedCard({
  children,
  style,
  onPress,
  disabled = false,
  bordered = false,
  selected = false,
  variant = "default",
}: ThemedCardProps) {
  const isPressable = typeof onPress === "function";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        bordered && styles.cardBordered,
        selected && styles.cardSelected,
        variant === "interactive" && styles.cardInteractive,
        isPressable && pressed && !disabled && styles.cardPressed,
        style,
      ]}
      onPress={onPress}
      disabled={!isPressable || disabled}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
    padding: spacing.md,
  },
  cardBordered: {
    borderColor: colors.borderDark,
  },
  cardSelected: {
    backgroundColor: colors.primaryOpacity10,
    borderColor: colors.primary,
  },
  cardInteractive: {
    backgroundColor: colors.primaryOpacity10,
  },
  cardPressed: {
    opacity: 0.8,
  },
});
