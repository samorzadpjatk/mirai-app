import { type ReactNode } from "react";
import { Modal } from "react-native";
import type { DimensionValue, StyleProp, ViewStyle } from "react-native";
import { YStack, XStack, Text, Button } from "@mirai-app/ui";

interface AppModalShellProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: DimensionValue;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: "card" | "pageSheet";
  maxWidth?: number;
}

export function AppModalShell({
  visible,
  title,
  onClose,
  children,
  maxHeight = "80%",
  contentStyle,
  variant = "card",
  maxWidth,
}: AppModalShellProps) {
  const isPageSheet = variant === "pageSheet";

  return (
    <Modal
      visible={visible}
      transparent={!isPageSheet}
      animationType={isPageSheet ? "slide" : "fade"}
      presentationStyle={isPageSheet ? "pageSheet" : undefined}
      onRequestClose={onClose}
    >
      {isPageSheet ? (
        <YStack flex={1} backgroundColor="$backgroundDark">
          <YStack flex={1} maxWidth={maxWidth}>
            <XStack
              justifyContent="space-between"
              alignItems="center"
              padding="$lg"
              borderBottomWidth={1}
              borderBottomColor="$borderDark"
            >
              <Text
                fontSize="$lg"
                fontWeight="700"
                color="$white"
                letterSpacing={-0.3}
              >
                {title}
              </Text>
              <Button onPress={onClose} chromeless padding="$xs">
                <Text fontSize={24} color="$textSecondary" fontWeight="600">
                  ✕
                </Text>
              </Button>
            </XStack>
            <YStack flex={1} maxHeight={maxHeight} style={contentStyle}>
              {children}
            </YStack>
          </YStack>
        </YStack>
      ) : (
        <Button
          onPress={onClose}
          fullscreen
          position="absolute"
          backgroundColor="rgba(0,0,0,0.4)"
          justifyContent="center"
          alignItems="center"
          paddingHorizontal="$lg"
        >
          <YStack
            backgroundColor="$cardDark"
            borderRadius="$lg"
            borderWidth={1}
            borderColor="$borderDark"
            width="85%"
            maxHeight="80%"
            maxWidth={maxWidth}
          >
            <XStack
              justifyContent="space-between"
              alignItems="center"
              padding="$lg"
              borderBottomWidth={1}
              borderBottomColor="rgba(255,255,255,0.05)"
            >
              <Text
                fontSize="$lg"
                fontWeight="700"
                color="$white"
                letterSpacing={-0.3}
              >
                {title}
              </Text>
              <Button onPress={onClose} chromeless padding="$xs">
                <Text fontSize={24} color="$textSecondary" fontWeight="600">
                  ✕
                </Text>
              </Button>
            </XStack>
            <YStack padding="$lg" style={contentStyle}>
              {children}
            </YStack>
          </YStack>
        </Button>
      )}
    </Modal>
  );
}
