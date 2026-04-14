import { Card, Text, YStack, XStack } from "@mirai-app/ui";
import { TouchableOpacity } from "react-native";
import type { ChallengeListItem } from "./types";
import { ChallengesGridItem } from "./ChallengesGridItem";

interface ChallengesGridProps {
  challenges: ChallengeListItem[];
  onSelectChallenge: (challenge: ChallengeListItem) => void;
}

export function ChallengesGrid({
  challenges,
  onSelectChallenge,
}: ChallengesGridProps) {
  if (challenges.length === 0) {
    return (
      <YStack padding="$8" alignItems="center">
        <Text variant="h5" color="muted" textAlign="center">
          No challenges available yet
        </Text>
        <Text variant="caption" color="muted" textAlign="center" marginTop="$2">
          Check back later for new challenges!
        </Text>
      </YStack>
    );
  }

  return (
    <XStack
      flexDirection="row"
      flexWrap="wrap"
      justifyContent="space-between"
      gap="$3"
      marginBottom={40}
    >
      {challenges.map((challenge) => (
        <YStack key={challenge.id} width="48%">
          <ChallengesGridItem
            challenge={challenge}
            onPress={onSelectChallenge}
          />
        </YStack>
      ))}
    </XStack>
  );
}
