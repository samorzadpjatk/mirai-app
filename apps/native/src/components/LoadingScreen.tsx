import { View, Text, ActivityIndicator } from "react-native";
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
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color="#00ced1" />
        <Text className="mt-4 text-white font-sans">
          {message}
        </Text>
      </View>
    </>
  );
}
