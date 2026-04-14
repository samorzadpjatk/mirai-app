import { YStack, Text } from "@mirai-app/ui";

interface AppInfoFooterProps {
  versionLabel: string;
  copyrightLabel: string;
}

export function AppInfoFooter({
  versionLabel,
  copyrightLabel,
}: AppInfoFooterProps) {
  return (
    <YStack alignItems="center" paddingVertical="$5" gap="$1">
      <Text variant="caption" color="muted">
        {versionLabel}
      </Text>
      <Text variant="caption" color="muted">
        {copyrightLabel}
      </Text>
    </YStack>
  );
}
