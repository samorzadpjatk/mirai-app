import type { ReactNode } from "react";
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, spacing } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

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
  const styles = useThemedStyles(makeStyles);
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
      <WoodTexture radius={borderRadius.md} />
      {children}
    </Pressable>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: "transparent",
      padding: spacing.md,
    },
    cardBordered: {
      borderColor: palette.borderDark,
    },
    cardSelected: {
      backgroundColor: palette.primaryOpacity10,
      borderColor: palette.primary,
    },
    cardInteractive: {
      backgroundColor: palette.primaryOpacity10,
    },
    cardPressed: {
      opacity: 0.8,
    },
  });
}
