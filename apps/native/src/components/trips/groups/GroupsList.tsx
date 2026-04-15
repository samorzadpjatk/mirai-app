import { YStack, Text } from "@mirai-app/ui";
import { GroupCard } from "./GroupCard";
import type { GroupListItem } from "./types";

interface GroupsListProps {
  groups: GroupListItem[];
  onSelectGroup: (group: GroupListItem) => void;
  myGroupId?: string | null;
}

export function GroupsList({
  groups,
  onSelectGroup,
  myGroupId,
}: GroupsListProps) {
  if (groups.length === 0) {
    return (
      <YStack paddingVertical="$8" alignItems="center">
        <Text fontSize="$base" color="$textMuted">
          No groups found
        </Text>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onPress={onSelectGroup}
          isMyGroup={Boolean(myGroupId && group.id === myGroupId)}
        />
      ))}
    </YStack>
  );
}
