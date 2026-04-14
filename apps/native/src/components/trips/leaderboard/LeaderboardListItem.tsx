import { Image } from "react-native";
import { styled, Text, XStack, YStack, Card } from "@mirai-app/ui";
import type { RankedGroup } from "./types";

interface LeaderboardListItemProps {
  group: RankedGroup;
  onPress?: (group: RankedGroup) => void;
}

const Row = styled(XStack, {
  name: "LeaderboardRow",
  alignItems: "center",
  gap: "$lg",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  paddingHorizontal: "$lg",
  paddingVertical: "$md",
  borderRadius: "$xl",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.05)",
});

const RowActive = styled(Row, {
  name: "LeaderboardRowActive",
  backgroundColor: "rgba(0, 206, 209, 0.1)",
  borderColor: "rgba(0, 206, 209, 0.3)",
  borderLeftWidth: 4,
  borderLeftColor: "$primary",
});

const RankCell = styled(YStack, {
  name: "RankCell",
  width: 32,
  alignItems: "center",
});

const RankText = styled(Text, {
  name: "RankText",
  fontSize: "$sm",
  fontWeight: "$bold",
  color: "rgba(255, 255, 255, 0.6)",
});

const RankTextActive = styled(RankText, {
  name: "RankTextActive",
  color: "$primary",
});

const Avatar = styled(YStack, {
  name: "LeaderboardAvatar",
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "$cardDark",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
});

const AvatarActive = styled(Avatar, {
  name: "LeaderboardAvatarActive",
  borderWidth: 2,
  borderColor: "rgba(0, 206, 209, 0.2)",
});

const AvatarImage = styled(Image, {
  name: "LeaderboardAvatarImage",
  width: "100%",
  height: "100%",
});

const AvatarText = styled(Text, {
  name: "AvatarText",
  fontSize: "$lg",
  fontWeight: "$bold",
  color: "$white",
});

const Content = styled(YStack, {
  name: "LeaderboardContent",
  flex: 1,
});

const NameRow = styled(XStack, {
  name: "NameRow",
  alignItems: "center",
  gap: "$sm",
});

const GroupName = styled(Text, {
  name: "GroupName",
  fontSize: "$base",
  fontWeight: "$bold",
  color: "$white",
});

const YouBadge = styled(YStack, {
  name: "YouBadge",
  backgroundColor: "$primary",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: "$sm",
});

const YouBadgeText = styled(Text, {
  name: "YouBadgeText",
  fontSize: 10,
  fontWeight: "$bold",
  color: "$backgroundDark",
  textTransform: "uppercase",
});

const MemberCount = styled(Text, {
  name: "MemberCount",
  fontSize: "$xs",
  color: "rgba(255, 255, 255, 0.4)",
  marginTop: 2,
});

const ScoreCell = styled(YStack, {
  name: "ScoreCell",
  alignItems: "flex-end",
});

const ScoreText = styled(Text, {
  name: "ScoreText",
  fontSize: "$base",
  fontWeight: "$bold",
  color: "rgba(255, 255, 255, 0.8)",
});

const ScoreTextActive = styled(ScoreText, {
  name: "ScoreTextActive",
  color: "$primary",
});

export function LeaderboardListItem({
  group,
  onPress,
}: LeaderboardListItemProps) {
  const RowComponent = group.isCurrentUserGroup ? RowActive : Row;
  const RankTextComponent = group.isCurrentUserGroup
    ? RankTextActive
    : RankText;
  const ScoreTextComponent = group.isCurrentUserGroup
    ? ScoreTextActive
    : ScoreText;
  const AvatarComponent = group.isCurrentUserGroup ? AvatarActive : Avatar;

  return (
    <Card
      onPress={() => onPress?.(group)}
      pressStyle={{ opacity: 0.85 }}
      backgroundColor="transparent"
      borderWidth={0}
      padding={0}
    >
      <RowComponent>
        <RankCell>
          <RankTextComponent>{group.rank}</RankTextComponent>
        </RankCell>

        <AvatarComponent>
          {group.image ? (
            <AvatarImage source={{ uri: group.image }} resizeMode="cover" />
          ) : (
            <AvatarText>{group.name.charAt(0)}</AvatarText>
          )}
        </AvatarComponent>

        <Content>
          <NameRow>
            <GroupName>{group.name}</GroupName>
            {group.isCurrentUserGroup && (
              <YouBadge>
                <YouBadgeText>YOUR GROUP</YouBadgeText>
              </YouBadge>
            )}
          </NameRow>
          <MemberCount>{group.memberCount} Members active</MemberCount>
        </Content>

        <ScoreCell>
          <ScoreTextComponent>
            {group.coins.toLocaleString()} pts
          </ScoreTextComponent>
        </ScoreCell>
      </RowComponent>
    </Card>
  );
}
