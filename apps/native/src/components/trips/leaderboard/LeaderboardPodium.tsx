import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styled, Text, YStack, XStack, Card } from "@mirai-app/ui";
import type { RankedGroup } from "./types";

const MEDAL_COLORS = {
  gold: "#FFCC00",
  silver: "#BFBFBF",
  bronze: "#B36F2E",
};

interface PodiumPlaceProps {
  group?: RankedGroup;
  position: 1 | 2 | 3;
  onPressGroup?: (group: RankedGroup) => void;
}

const PodiumColumn = styled(YStack, {
  name: "PodiumColumn",
  flex: 1,
  alignItems: "center",
});

const AvatarContainer = styled(YStack, {
  name: "AvatarContainer",
  position: "relative",
  marginBottom: "$md",
});

const CrownIcon = styled(YStack, {
  name: "CrownIcon",
  position: "absolute",
  top: -24,
  left: "50%",
  transform: [{ translateX: -15 }],
});

const RankBadge = styled(YStack, {
  name: "RankBadge",
  position: "absolute",
  bottom: -4,
  right: -4,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: "$full",
});

const RankBadgeText = styled(Text, {
  name: "RankBadgeText",
  fontSize: 10,
  fontWeight: "$bold",
  color: "$backgroundDark",
});

const PodiumBase = styled(YStack, {
  name: "Podium",
  width: "100%",
  backgroundColor: "rgba(28, 31, 33, 0.5)",
  borderTopLeftRadius: "$xl",
  borderTopRightRadius: "$xl",
  borderTopWidth: 1,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  paddingTop: "$lg",
  alignItems: "center",
});

const PodiumName = styled(Text, {
  name: "PodiumName",
  fontWeight: "$bold",
  color: "$white",
  textAlign: "center",
  paddingHorizontal: "$sm",
});

const PodiumNameLarge = styled(PodiumName, {
  name: "PodiumNameLarge",
  fontSize: "$sm",
});

const PodiumNameSmall = styled(PodiumName, {
  name: "PodiumNameSmall",
  fontSize: "$xs",
});

const PodiumScore = styled(Text, {
  name: "PodiumScore",
  fontWeight: "$bold",
  color: "$primary",
  marginTop: "$xs",
});

const PodiumScoreLarge = styled(PodiumScore, {
  name: "PodiumScoreLarge",
  fontSize: "$lg",
});

const PodiumScoreSmall = styled(PodiumScore, {
  name: "PodiumScoreSmall",
  fontSize: "$sm",
});

const Container = styled(YStack, {
  name: "PodiumContainer",
  paddingHorizontal: "$lg",
  paddingTop: "$xl",
  paddingBottom: "$xl",
  position: "relative",
});

const PodiumRow = styled(XStack, {
  name: "PodiumRow",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: "$md",
  height: 280,
});

const FirstPlaceOffset = styled(YStack, {
  name: "FirstPlaceOffset",
  transform: [{ translateY: -16 }],
});

const EmptyAvatar = styled(YStack, {
  name: "EmptyAvatar",
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  marginBottom: "$md",
});

const EmptyPodium = styled(YStack, {
  name: "EmptyPodium",
  width: "100%",
  height: 96,
  backgroundColor: "rgba(255, 255, 255, 0.02)",
  borderTopLeftRadius: "$xl",
  borderTopRightRadius: "$xl",
});

const EmptyPodiumTall = styled(EmptyPodium, {
  name: "EmptyPodiumTall",
  height: 176,
});

function PodiumPlace({ group, position, onPressGroup }: PodiumPlaceProps) {
  if (!group) {
    return (
      <PodiumColumn>
        <EmptyAvatar />
        {position === 1 ? <EmptyPodiumTall /> : <EmptyPodium />}
      </PodiumColumn>
    );
  }

  const medalColor =
    position === 1
      ? MEDAL_COLORS.gold
      : position === 2
        ? MEDAL_COLORS.silver
        : MEDAL_COLORS.bronze;
  const avatarSize = position === 1 ? 80 : position === 2 ? 64 : 56;
  const podiumHeight = position === 1 ? 176 : position === 2 ? 128 : 96;
  const borderColor =
    position === 1 ? "rgba(255, 204, 0, 0.3)" : "rgba(255, 255, 255, 0.1)";

  return (
    <Card
      onPress={() => onPressGroup?.(group)}
      pressStyle={{ opacity: 0.85 }}
      backgroundColor="transparent"
      borderWidth={0}
      padding={0}
    >
      <PodiumColumn>
        <AvatarContainer>
          <YStack
            width={avatarSize}
            height={avatarSize}
            borderRadius={avatarSize / 2}
            borderWidth={2}
            borderColor={medalColor}
            backgroundColor="$cardDark"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            {...(position === 1 && {
              shadowColor: MEDAL_COLORS.gold,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            })}
          >
            {group.image ? (
              <Image
                source={{ uri: group.image }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text fontSize={24} fontWeight="$bold" color={medalColor}>
                {group.name.charAt(0)}
              </Text>
            )}
          </YStack>

          {position === 1 && (
            <CrownIcon>
              <Ionicons name="ribbon" size={30} color={MEDAL_COLORS.gold} />
            </CrownIcon>
          )}

          <RankBadge backgroundColor={medalColor}>
            <RankBadgeText>
              {position === 1 ? "1ST" : position === 2 ? "2ND" : "3RD"}
            </RankBadgeText>
          </RankBadge>
        </AvatarContainer>

        <PodiumBase height={podiumHeight} borderColor={borderColor}>
          <YStack marginBottom="$xs">
            <Ionicons
              name="trophy"
              size={position === 1 ? 32 : 24}
              color={medalColor}
            />
          </YStack>
          {position === 1 ? (
            <PodiumNameLarge numberOfLines={1}>{group.name}</PodiumNameLarge>
          ) : (
            <PodiumNameSmall numberOfLines={1}>{group.name}</PodiumNameSmall>
          )}
          {position === 1 ? (
            <PodiumScoreLarge>
              {group.coins.toLocaleString()} pts
            </PodiumScoreLarge>
          ) : (
            <PodiumScoreSmall>
              {group.coins.toLocaleString()} pts
            </PodiumScoreSmall>
          )}
        </PodiumBase>
      </PodiumColumn>
    </Card>
  );
}

interface LeaderboardPodiumProps {
  topThree: RankedGroup[];
  onPressGroup?: (group: RankedGroup) => void;
}

export function LeaderboardPodium({
  topThree,
  onPressGroup,
}: LeaderboardPodiumProps) {
  return (
    <Container paddingTop={96}>
      <PodiumRow>
        <PodiumPlace
          group={topThree[1]}
          position={2}
          onPressGroup={onPressGroup}
        />
        <FirstPlaceOffset>
          <PodiumPlace
            group={topThree[0]}
            position={1}
            onPressGroup={onPressGroup}
          />
        </FirstPlaceOffset>
        <PodiumPlace
          group={topThree[2]}
          position={3}
          onPressGroup={onPressGroup}
        />
      </PodiumRow>
    </Container>
  );
}
