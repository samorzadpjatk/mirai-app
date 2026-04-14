import { ActivityIndicator } from "react-native";
import { Card, Text, XStack, YStack } from "@mirai-app/ui";

interface ChallengeUploadProgressCardProps {
  progress?: number | null;
}

export function ChallengeUploadProgressCard({
  progress,
}: ChallengeUploadProgressCardProps) {
  const resolvedProgress =
    typeof progress === "number" ? Math.min(Math.max(progress, 0), 1) : null;
  const percentLabel =
    resolvedProgress === null
      ? "Preparing upload..."
      : `${Math.round(resolvedProgress * 100)}%`;

  return (
    <Card
      marginBottom="$5"
      borderWidth={1}
      borderColor="rgba(0, 206, 209, 0.3)"
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$4"
      >
        <Text
          fontSize={13}
          fontWeight="$bold"
          color="primary"
          textTransform="uppercase"
          letterSpacing={1.5}
        >
          Uploading submission
        </Text>
        <ActivityIndicator size="small" color="#00ced1" />
      </XStack>
      <Text fontSize={13} color="muted" marginBottom="$2">
        {percentLabel}
      </Text>
      <YStack
        height={8}
        backgroundColor="rgba(255,255,255,0.1)"
        borderRadius="$md"
        overflow="hidden"
      >
        <YStack
          height="100%"
          backgroundColor="#00ced1"
          borderRadius="$md"
          flex={resolvedProgress ?? 0}
          minWidth={0}
        />
      </YStack>
    </Card>
  );
}
