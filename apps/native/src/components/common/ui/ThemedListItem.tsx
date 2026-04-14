import { type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Button, Text, XStack, YStack } from "@mirai-app/ui";
import { UserAvatar } from "~/components/map/ui/UserAvatar";

interface ThemedListItemProps {
  title: string;
  subtitle?: string;
  leftAvatar?: {
    name: string;
    imageUrl?: string | null;
  };
  rightElement?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ThemedListItem({
  title,
  subtitle,
  leftAvatar,
  rightElement,
  onPress,
  disabled = false,
  selected = false,
  bordered = false,
  style,
}: ThemedListItemProps) {
  const isPressable = typeof onPress === "function";

  return (
    <Button
      chromeless
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical="$sm"
      paddingHorizontal="$md"
      borderRadius="$md"
      backgroundColor="$primaryOpacity10"
      marginBottom="$sm"
      borderWidth={1}
      borderColor={
        selected ? "$primary" : bordered ? "$borderDark" : "transparent"
      }
      opacity={isPressable ? (disabled ? 1 : 0.8) : 1}
      pressStyle={{ opacity: 0.8 }}
      onPress={onPress}
      disabled={!isPressable || disabled}
      style={style}
    >
      <XStack alignItems="center" gap="$md" flex={1}>
        {leftAvatar && (
          <YStack
            width={52}
            height={52}
            borderRadius={26}
            borderWidth={2}
            borderColor="rgba(0, 206, 209, 0.3)"
            overflow="hidden"
            backgroundColor="$backgroundDark"
            padding={2}
          >
            <UserAvatar
              imageUrl={leftAvatar.imageUrl ?? null}
              name={leftAvatar.name}
              size={48}
            />
          </YStack>
        )}
        <YStack flex={1}>
          <Text fontSize="$base" fontWeight="600" color="$white">
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="$sm" color="$textSecondary" marginTop={2}>
              {subtitle}
            </Text>
          )}
        </YStack>
        {rightElement}
      </XStack>
    </Button>
  );
}
