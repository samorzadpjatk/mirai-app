import { YStack, XStack, Text } from "@mirai-app/ui";

interface GroupStatsGridProps {
  membersCount: number;
  coins: number;
  rankingPosition?: number | null;
}

export function GroupStatsGrid({
  membersCount,
  coins,
  rankingPosition,
}: GroupStatsGridProps) {
  return (
    <XStack gap="$3" marginBottom="$4">
      <YStack
        flex={1}
        backgroundColor="$card"
        padding="$4"
        borderRadius="$5"
        borderWidth={1}
        borderColor="rgba(255, 255, 255, 0.05)"
        alignItems="center"
        justifyContent="center"
      >
        <Text
          fontSize={10}
          fontWeight="bold"
          color="$colorMuted"
          textTransform="uppercase"
          letterSpacing={1.5}
          marginBottom="$1"
        >
          Members
        </Text>
        <Text fontSize="$xl" fontWeight="bold" color="$color">
          {membersCount}
        </Text>
      </YStack>

      <YStack
        flex={1}
        backgroundColor="$card"
        padding="$4"
        borderRadius="$5"
        borderWidth={1}
        borderColor="rgba(255, 255, 255, 0.05)"
        alignItems="center"
        justifyContent="center"
      >
        <Text
          fontSize={10}
          fontWeight="bold"
          color="$colorMuted"
          textTransform="uppercase"
          letterSpacing={1.5}
          marginBottom="$1"
        >
          Coins
        </Text>
        <Text fontSize="$xl" fontWeight="bold" color="rgba(0, 206, 209, 1)">
          {coins.toLocaleString()}
        </Text>
      </YStack>

      <YStack
        flex={1}
        backgroundColor="$card"
        padding="$4"
        borderRadius="$5"
        borderWidth={1}
        borderColor="rgba(255, 255, 255, 0.05)"
        alignItems="center"
        justifyContent="center"
      >
        <Text
          fontSize={10}
          fontWeight="bold"
          color="$colorMuted"
          textTransform="uppercase"
          letterSpacing={1.5}
          marginBottom="$1"
        >
          Position
        </Text>
        <Text
          fontSize={rankingPosition ? "$xl" : "$lg"}
          fontWeight="bold"
          color="rgba(0, 206, 209, 1)"
        >
          {rankingPosition ? `#${rankingPosition}` : "--"}
        </Text>
      </YStack>
    </XStack>
  );
}
