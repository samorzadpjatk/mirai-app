import { Ionicons } from "@expo/vector-icons";
import { Button, Text, XStack } from "@mirai-app/ui";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

interface PrimaryAddButtonProps {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PrimaryAddButton({
  onPress,
  label = "Add New",
  disabled = false,
  style,
  textStyle,
}: PrimaryAddButtonProps) {
  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      backgroundColor="$primary"
      borderRadius="$lg"
      paddingVertical="$md"
      paddingHorizontal="$lg"
      minWidth={120}
      opacity={disabled ? 0.6 : 1}
      pressStyle={{ scale: 0.98 }}
      style={style}
    >
      <XStack
        alignItems="center"
        justifyContent="center"
        gap="$md"
        style={{
          shadowColor: "#00ced1",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <Ionicons name="add-circle" size={24} color="#17181c" />
        <Text
          fontSize={14}
          fontWeight="700"
          color="$backgroundDark"
          letterSpacing={0.5}
          textTransform="uppercase"
          style={textStyle}
        >
          {label}
        </Text>
      </XStack>
    </Button>
  );
}
