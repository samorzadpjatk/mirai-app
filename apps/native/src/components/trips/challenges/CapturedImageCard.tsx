import { TouchableOpacity } from "react-native";
import { Card, Text, XStack, YStack, Image } from "@mirai-app/ui";
import { Ionicons } from "@expo/vector-icons";

interface CapturedImageCardProps {
  imageUri: string;
  onRetake: () => void;
  onDone: () => void;
}

export function CapturedImageCard({
  imageUri,
  onRetake,
  onDone,
}: CapturedImageCardProps) {
  return (
    <Card
      marginBottom="$5"
      borderWidth={1}
      borderColor="rgba(0, 206, 209, 0.3)"
    >
      <Text
        fontSize={12}
        fontWeight="$bold"
        color="primary"
        textTransform="uppercase"
        letterSpacing={2}
        marginBottom="$4"
        textAlign="center"
      >
        Submission sent - pending review
      </Text>

      <Image
        source={{ uri: imageUri }}
        width="100%"
        aspectRatio={4 / 3}
        borderRadius="$lg"
        marginBottom="$4"
        resizeMode="contain"
      />

      <XStack gap="$3">
        <TouchableOpacity
          onPress={onRetake}
          style={{ flex: 1 }}
          activeOpacity={0.8}
        >
          <YStack
            backgroundColor="rgba(239, 68, 68, 0.1)"
            borderRadius="$md"
            padding="$3"
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            gap="$2"
            borderWidth={1}
            borderColor="rgba(239, 68, 68, 0.3)"
          >
            <Ionicons name="refresh" size={20} color="#ef4444" />
            <Text
              fontSize={13}
              fontWeight="$bold"
              color="#ef4444"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Retake
            </Text>
          </YStack>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDone}
          style={{ flex: 1 }}
          activeOpacity={0.8}
        >
          <YStack
            backgroundColor="#00ced1"
            borderRadius="$md"
            padding="$3"
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            gap="$2"
          >
            <Ionicons name="checkmark-circle" size={20} color="#17181c" />
            <Text
              fontSize={13}
              fontWeight="$bold"
              color="#17181c"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Done
            </Text>
          </YStack>
        </TouchableOpacity>
      </XStack>
    </Card>
  );
}
