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
        bg="$background"
        items="center"
        justify="center"
      >
        <Spinner size="large" />
        <Text mt="$4">
          {message}
        </Text>
      </YStack>
    </>
  );
}
