import { YStack, H1, Text, View } from "tamagui";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function Home() {
  return (
    <>
      <StatusBar style="auto" />
      <YStack
        backgroundColor="$background"
        flex={1}
        padding="$6"
        paddingTop="$12"
      >
        <YStack space="$6" flex={1}>
          <YStack space="$4" alignItems="center">
            <View
              width={120}
              height={120}
              borderRadius={60}
              borderWidth={6}
              borderColor="$red9"
              overflow="hidden"
              animation="quick"
              enterStyle={{ scale: 0, opacity: 0 }}
              scale={1}
              opacity={1}
            >
              <View width="100%" height="50%" backgroundColor="white" />
              <View width="100%" height="50%" backgroundColor="$red9" />
            </View>
            <YStack space="$2" alignItems="center">
              <H1
                color="$color"
                fontSize="$11"
                fontWeight="900"
                textAlign="center"
                letterSpacing={-1}
                animation="quick"
                enterStyle={{ y: -20, opacity: 0 }}
                y={0}
                opacity={1}
              >
                Welcome to PJapp
              </H1>
              <Text
                color="$gray11"
                fontSize="$5"
                textAlign="center"
                opacity={0.7}
                fontWeight="500"
                animation="quick"
                enterStyle={{ y: -10, opacity: 0 }}
                y={0}
              >
                Development in progress...
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </>
  );
}
