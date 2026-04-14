import { type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Card } from "@mirai-app/ui";

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
    <Card
      backgroundColor={
        selected || variant === "interactive"
          ? "$primaryOpacity10"
          : "$cardDark"
      }
      borderRadius="$md"
      borderWidth={1}
      borderColor={
        selected ? "$primary" : bordered ? "$borderDark" : "transparent"
      }
      padding="$md"
      disabled={!isPressable || disabled}
      onPress={onPress}
      opacity={isPressable ? (disabled ? 1 : 0.8) : 1}
      pressStyle={{ opacity: 0.8 }}
      style={style}
    >
      {children}
    </Card>
  );
}
