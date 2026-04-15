import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { YStack, XStack, Text } from "@mirai-app/ui";

interface GroupDetailsHeroProps {
  name: string;
  imageUrl?: string | null;
}

export function GroupDetailsHero({ name, imageUrl }: GroupDetailsHeroProps) {
  return (
    <YStack
      position="relative"
      height={192}
      borderRadius="$5"
      backgroundColor="rgba(35, 38, 43, 1)"
      borderWidth={1}
      borderColor="rgba(0, 206, 209, 0.2)"
      overflow="hidden"
      marginBottom="$4"
    >
      {imageUrl ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(23, 24, 28, 0.45)"
          />
        </>
      ) : (
        <YStack
          width="100%"
          height="100%"
          alignItems="center"
          justifyContent="center"
          gap="$2"
          backgroundColor="rgba(39, 41, 53, 0.9)"
        >
          <Ionicons
            name="images-outline"
            size={40}
            color="rgba(0, 206, 209, 1)"
          />
          <Text
            fontSize="$sm"
            fontWeight="500"
            color="rgba(148, 163, 184, 1)"
            textTransform="uppercase"
            letterSpacing={1}
          >
            No group image
          </Text>
        </YStack>
      )}

      <YStack position="absolute" left="$5" right="$5" bottom="$4" zIndex={5}>
        <Text
          fontSize={28}
          fontWeight="bold"
          color="white"
          letterSpacing={-0.4}
          lineHeight={30}
        >
          {name}
        </Text>
      </YStack>
    </YStack>
  );
}
