import { YStack, Text } from "@mirai-app/ui";

interface AlertsHeaderProps {
  title: string;
  subtitle: string;
}

export function AlertsHeader({ title, subtitle }: AlertsHeaderProps) {
  return (
    <YStack marginBottom="$6">
      <Text
        fontSize="$8"
        fontWeight="bold"
        color="white"
        marginBottom="$1"
        letterSpacing={-0.5}
      >
        {title}
      </Text>
      <Text fontSize="$3" color="$colorMuted">
        {subtitle}
      </Text>
    </YStack>
  );
}
