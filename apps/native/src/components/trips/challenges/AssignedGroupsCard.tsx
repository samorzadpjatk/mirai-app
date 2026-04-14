import { Card, Text, YStack } from "@mirai-app/ui";

interface AssignedGroup {
  id: string;
  group: {
    name: string;
    organizer?: {
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  };
}

interface AssignedGroupsCardProps {
  groups: AssignedGroup[];
}

export function AssignedGroupsCard({ groups }: AssignedGroupsCardProps) {
  if (groups.length === 0) return null;

  return (
    <Card
      marginBottom="$5"
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.05)"
    >
      <Text
        fontSize={12}
        fontWeight="$bold"
        color="muted"
        textTransform="uppercase"
        letterSpacing={2}
        marginBottom="$4"
      >
        Assigned to Groups
      </Text>
      {groups.map((group) => (
        <YStack
          key={group.id}
          backgroundColor="rgba(39, 41, 53, 0.5)"
          padding="$3"
          borderRadius="$md"
          marginBottom="$2"
          borderWidth={1}
          borderColor="rgba(255, 255, 255, 0.05)"
        >
          <Text fontSize={14} fontWeight="$bold" color="white">
            {group.group.name}
          </Text>
          {group.group.organizer && (
            <Text fontSize={13} color="muted" marginTop={4}>
              Leader: {group.group.organizer.firstName}{" "}
              {group.group.organizer.lastName}
            </Text>
          )}
        </YStack>
      ))}
    </Card>
  );
}
