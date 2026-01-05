import { Button, YStack, Paragraph } from "tamagui";

interface NavGridProps {
  isAdmin?: boolean;
  isModerator?: boolean;
  onNavigate: (path: string) => void;
}

export default function NavGrid({ isAdmin = false, isModerator = false, onNavigate }: NavGridProps) {
  return (
    <YStack gap="$2" width="100%">
      {!isAdmin && (
        <Button size="$5" onPress={() => onNavigate("/group/my")}>
          <Paragraph>Your Guild Hall</Paragraph>
        </Button>
      )}
      <Button size="$5" onPress={() => onNavigate("/ranking")}>
        <Paragraph>Leaderboard of Guilds</Paragraph>
      </Button>
      {(isAdmin || isModerator) && (
        <Button size="$5" onPress={() => onNavigate("/admin/groups")}>
          <Paragraph>Chamber of Administration</Paragraph>
        </Button>
      )}
      <Button size="$5" onPress={() => onNavigate("/notifications")}>
        <Paragraph>Notifications</Paragraph>
      </Button>
      <Button size="$5" onPress={() => onNavigate("/map")}>
        <Paragraph>Map Viewer</Paragraph>
      </Button>
    </YStack>
  );
}
