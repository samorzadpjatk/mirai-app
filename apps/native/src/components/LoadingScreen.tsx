import { YStack, Text, Spinner } from "@mirai-app/ui";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading...",
}: LoadingScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <StatusBar style="auto" />
      <YStack
        flex={1}
        backgroundColor="#17181c"
        alignItems="center"
        justifyContent="center"
      >
        <YStack
          flex={1}
          alignSelf="stretch"
          padding={16}
          paddingBottom={120}
          gap={16}
          alignItems="center"
          justifyContent="center"
          paddingTop={insets.top + 16}
        >
          <Spinner size="large" color="#00ced1" />
          <Text
            marginTop={12}
            color="white"
            fontSize={16}
            fontWeight="500"
            lineHeight={24}
            textAlign="center"
          >
            {message}
          </Text>
        </YStack>
      </YStack>
    </>
  );
}
