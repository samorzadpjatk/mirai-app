import { XStack, YStack, Text } from "@mirai-app/ui";
import Logo from "./Logo";

export default function AppNavbar() {
  return (
    <XStack
      alignItems="center"
      gap={12}
      paddingHorizontal={16}
      paddingVertical={16}
      backgroundColor="rgba(23, 24, 28, 0.8)"
    >
      <YStack
        width={40}
        height={40}
        borderRadius={8}
        alignItems="center"
        justifyContent="center"
        style={{
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 15,
          elevation: 8,
        }}
      >
        <Logo size={40} />
      </YStack>
      <Text
        fontSize={20}
        fontWeight="700"
        color="white"
        letterSpacing={-0.5}
        lineHeight={24}
      >
        PJapp
      </Text>
    </XStack>
  );
}
