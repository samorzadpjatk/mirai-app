import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styled, Text, YStack, Card } from "@mirai-app/ui";
import type { GroupListItem } from "./types";

interface GroupCardProps {
  group: GroupListItem;
  onPress: (group: GroupListItem) => void;
  isMyGroup?: boolean;
}

const GroupCardComponent = styled(Card, {
  name: "GroupCard",
  backgroundColor: "$cardDark",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.05)",
  borderRadius: "$xl",
  padding: "$lg",
  flexDirection: "row",
  alignItems: "center",
  gap: "$lg",
});

const GroupCardMine = styled(GroupCardComponent, {
  name: "GroupCardMine",
  borderColor: "$primary",
  backgroundColor: "$primaryOpacity10",
});

const GroupImage = styled(Image, {
  name: "GroupImage",
  width: 64,
  height: 64,
  borderRadius: "$md",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.1)",
});

const GroupImagePlaceholder = styled(YStack, {
  name: "GroupImagePlaceholder",
  width: 64,
  height: 64,
  borderRadius: "$md",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.1)",
  backgroundColor: "rgba(39, 41, 53, 0.8)",
  alignItems: "center",
  justifyContent: "center",
});

const GroupInfo = styled(YStack, {
  name: "GroupInfo",
  flex: 1,
  gap: "$xs",
});

const MyGroupBadge = styled(YStack, {
  name: "MyGroupBadge",
  alignSelf: "flex-start",
  borderRadius: "$full",
  paddingHorizontal: "$sm",
  paddingVertical: "$xs",
  backgroundColor: "$primaryOpacity20",
  borderWidth: 1,
  borderColor: "$primaryOpacity30",
});

const MyGroupBadgeText = styled(Text, {
  name: "MyGroupBadgeText",
  fontSize: "$xs",
  fontWeight: "$bold",
  color: "$primary",
  textTransform: "uppercase",
  letterSpacing: 1.2,
});

const GroupName = styled(Text, {
  name: "GroupName",
  fontSize: "$lg",
  fontWeight: "$bold",
  color: "$white",
  letterSpacing: -0.5,
});

const GroupCode = styled(Text, {
  name: "GroupCode",
  fontSize: "$sm",
  fontWeight: "$medium",
  color: "$textMuted",
});

const GroupStats = styled(YStack, {
  name: "GroupStats",
  alignItems: "flex-end",
});

const GroupMemberCount = styled(Text, {
  name: "GroupMemberCount",
  fontSize: "$lg",
  fontWeight: "$bold",
  color: "$white",
});

const GroupMemberLabel = styled(Text, {
  name: "GroupMemberLabel",
  fontSize: "$xs",
  fontWeight: "$bold",
  color: "$textMuted",
  textTransform: "uppercase",
  letterSpacing: 1.5,
});

export function GroupCard({
  group,
  onPress,
  isMyGroup = false,
}: GroupCardProps) {
  const CardComponent = isMyGroup ? GroupCardMine : GroupCardComponent;

  return (
    <CardComponent onPress={() => onPress(group)} pressStyle={{ opacity: 0.8 }}>
      <YStack position="relative">
        {group.image ? (
          <GroupImage source={{ uri: group.image }} resizeMode="cover" />
        ) : (
          <GroupImagePlaceholder>
            <Ionicons name="images-outline" size={20} color="#00CED1" />
          </GroupImagePlaceholder>
        )}
      </YStack>

      <GroupInfo>
        {isMyGroup ? (
          <MyGroupBadge>
            <MyGroupBadgeText>Your group</MyGroupBadgeText>
          </MyGroupBadge>
        ) : null}
        <GroupName>{group.name}</GroupName>
        <GroupCode>{group.code}</GroupCode>
      </GroupInfo>

      <GroupStats>
        <GroupMemberCount>{group.participantCount}</GroupMemberCount>
        <GroupMemberLabel>MEMBERS</GroupMemberLabel>
      </GroupStats>
    </CardComponent>
  );
}
