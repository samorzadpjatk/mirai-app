import { YStack, Text } from "tamagui";
import React from "react";

interface FooterProps {
  appName?: string;
  version?: string;
}

export default function Footer({
  appName = "PJapp Native",
  version = "v0.0.0",
}: FooterProps) {
  return (
    <YStack flex={1} justifyContent="flex-end" alignItems="center">
      <Text
        fontSize="$2"
        opacity={0.5}
        textAlign="center"
      >
        {appName} • {version}
      </Text>
    </YStack>
  );
}
