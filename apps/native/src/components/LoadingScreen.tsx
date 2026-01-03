import { YStack, Spinner, Text } from "tamagui";
import { StatusBar } from "expo-status-bar";
import React from "react";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading...",
}: LoadingScreenProps) {
  return (
    <>
      <StatusBar style="auto" />
      <YStack
        flex={1}
        backgroundColor="$background"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="large" />
        <Text marginTop="$4">
          {message}
        </Text>
      </YStack>
    </>
  );
}
