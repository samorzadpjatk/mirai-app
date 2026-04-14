import React from "react";
import { Modal } from "react-native";
import { YStack, XStack, Text, Button } from "@mirai-app/ui";
import { SafeAreaTop } from "~/components/SafeAreaWrapper";
import { Ionicons } from "@expo/vector-icons";

interface FullScreenModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function FullScreenModal({
  visible,
  title,
  onClose,
  children,
}: FullScreenModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <YStack flex={1} backgroundColor="$backgroundDark">
        <SafeAreaTop style={{ backgroundColor: "#1b2828" }}>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$lg"
            paddingVertical="$md"
            borderBottomWidth={1}
            borderBottomColor="rgba(0, 206, 209, 0.1)"
          >
            <Text fontSize="$lg" fontWeight="700" color="$white">
              {title}
            </Text>
            <Button
              onPress={onClose}
              width={40}
              height={40}
              borderRadius="$full"
              backgroundColor="rgba(0, 206, 209, 0.1)"
              alignItems="center"
              justifyContent="center"
              chromeless
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </Button>
          </XStack>
        </SafeAreaTop>
        <YStack flex={1}>{children}</YStack>
      </YStack>
    </Modal>
  );
}
