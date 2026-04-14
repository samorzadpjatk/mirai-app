import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { XStack, YStack, Text } from "@mirai-app/ui";

interface LocationPermissionDeniedProps {
  /** Whether to show a compact version or full message */
  compact?: boolean;
}

export function LocationPermissionDenied({
  compact = false,
}: LocationPermissionDeniedProps) {
  if (compact) {
    return (
      <XStack
        alignItems="center"
        padding="$md"
        backgroundColor="rgba(15, 23, 42, 0.95)"
        borderRadius={12}
        borderWidth={1}
        borderColor="rgba(0, 206, 209, 0.3)"
        shadowColor="#000"
        shadowOpacity={0.3}
        shadowRadius={8}
        shadowOffset={{ width: 0, height: 2 }}
      >
        <Ionicons name="locate" size={16} color="#ffffff" />
        <Text fontSize="$sm" color="$white" marginLeft="$sm" fontWeight={500}>
          Location sharing disabled
        </Text>
      </XStack>
    );
  }

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$xl">
      <YStack marginBottom="$lg">
        <Ionicons name="locate" size={48} color="#475569" />
      </YStack>
      <Text
        fontSize="$xl"
        fontWeight={700}
        color="$white"
        textAlign="center"
        marginBottom="$md"
      >
        Location Sharing Disabled
      </Text>
      <Text
        fontSize="$base"
        color="$textMuted"
        textAlign="center"
        marginBottom="$lg"
        lineHeight={22}
      >
        Location sharing has been turned off. You can still view the map, but
        other users' locations won't be shown.
      </Text>
      <Text
        fontSize="$sm"
        color="$textMuted"
        textAlign="center"
        lineHeight={20}
      >
        To enable location sharing, go to your Profile settings and toggle
        "Enable Location Sharing".
      </Text>
    </YStack>
  );
}
