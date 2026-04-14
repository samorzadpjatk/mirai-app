import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@mirai-app/ui";
import type { StyleProp, ViewStyle } from "react-native";
import { Button, View } from "@mirai-app/ui";

interface FloatingActionButtonProps {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  iconSize?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function FloatingActionButton({
  onPress,
  iconName,
  accessibilityLabel,
  iconSize = 32,
  disabled = false,
  style,
}: FloatingActionButtonProps) {
  const theme = useTheme();

  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      width={58}
      height={58}
      borderRadius="$full"
      backgroundColor="$primary"
      alignItems="center"
      justifyContent="center"
      opacity={disabled ? 0.6 : 1}
      pressStyle={{ scale: 0.95 }}
      style={style}
    >
      <View
        style={{
          shadowColor: theme.primary?.val ?? "#00ced1",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Ionicons
          name={iconName}
          size={iconSize}
          color={theme.backgroundDark?.val ?? "#17181c"}
        />
      </View>
    </Button>
  );
}
