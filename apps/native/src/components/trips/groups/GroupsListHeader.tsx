import { Text, XStack } from "@mirai-app/ui";

interface GroupsListHeaderProps {
  title: string;
  count: number;
}

export function GroupsListHeader({ title, count }: GroupsListHeaderProps) {
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      paddingHorizontal="$xs"
      marginBottom="$lg"
    >
      <Text
        fontSize={10}
        fontWeight="700"
        color="$primary"
        letterSpacing={2}
        textTransform="uppercase"
      >
        {title}
      </Text>
      <Text
        fontSize={10}
        fontWeight="700"
        color="$gray100"
        textTransform="uppercase"
      >
        {count} Results
      </Text>
    </XStack>
  );
}
