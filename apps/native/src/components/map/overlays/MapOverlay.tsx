import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableOpacity } from "react-native";
import { XStack, YStack, Text } from "@mirai-app/ui";

interface MapOverlayProps {
  activeCount: number;
  fadedCount: number;
  onRecenter?: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Slopes-inspired overlay: subtle gradient top bar with counts and recenter action.
 */
export function MapOverlay({
  activeCount,
  fadedCount,
  onRecenter,
  title = "Live map",
  subtitle = "Tap avatar to inspect user",
}: MapOverlayProps) {
  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={["rgba(15,23,42,0.55)", "rgba(15,23,42,0)"]}
        locations={[0, 1]}
        style={{ paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12 }}
      >
        <XStack
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack>
            <Text fontSize={18} fontWeight="700" color="white">
              {title}
            </Text>
            <Text color="rgba(255,255,255,0.75)" marginTop={4}>
              {subtitle}
            </Text>
          </YStack>

          <XStack flexDirection="row" alignItems="center" gap={8}>
            <YStack
              paddingHorizontal={10}
              paddingVertical={6}
              borderRadius={12}
              backgroundColor="rgba(59,130,246,0.18)"
              borderWidth={1}
              borderColor="rgba(59,130,246,0.6)"
            >
              <Text color="white" fontSize={12}>
                Active
              </Text>
              <Text color="white" fontSize={14} fontWeight="700" marginTop={2}>
                {activeCount}
              </Text>
            </YStack>
            <YStack
              paddingHorizontal={10}
              paddingVertical={6}
              borderRadius={12}
              backgroundColor="rgba(148,163,184,0.16)"
              borderWidth={1}
              borderColor="rgba(148,163,184,0.4)"
            >
              <Text color="white" fontSize={12}>
                Faded
              </Text>
              <Text color="white" fontSize={14} fontWeight="700" marginTop={2}>
                {fadedCount}
              </Text>
            </YStack>
            {onRecenter ? (
              <TouchableOpacity onPress={onRecenter}>
                <YStack
                  paddingHorizontal={10}
                  paddingVertical={6}
                  borderRadius={12}
                  backgroundColor="rgba(15,23,42,0.2)"
                  borderWidth={1}
                  borderColor="rgba(255,255,255,0.3)"
                >
                  <Text color="white" fontSize={12}>
                    Center
                  </Text>
                </YStack>
              </TouchableOpacity>
            ) : null}
          </XStack>
        </XStack>
      </LinearGradient>
    </YStack>
  );
}
