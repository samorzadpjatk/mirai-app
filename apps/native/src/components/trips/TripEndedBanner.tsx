import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { XStack, Text } from "@mirai-app/ui";
import { colorTokens } from "@mirai-app/ui/theme";

interface TripEndedBannerProps {
  visible?: boolean;
}

export const TripEndedBanner: React.FC<TripEndedBannerProps> = ({
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <XStack
      alignItems="center"
      gap="$xs"
      backgroundColor={colorTokens.backgroundDarkOpacity55}
      borderWidth={1}
      borderColor="$warning"
      borderRadius="$md"
      padding="$sm"
      mx="$xl"
      mt="$sm"
      mb="$md"
    >
      <Ionicons
        name="information-circle-outline"
        size={16}
        color={colorTokens.warning}
      />
      <Text color="$warning" fontSize="$sm" fontWeight="500" flex={1}>
        This trip has ended — view only
      </Text>
    </XStack>
  );
};
