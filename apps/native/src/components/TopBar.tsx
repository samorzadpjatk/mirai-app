import { Home } from "@tamagui/lucide-icons";
import { XStack, Avatar, Button, Paragraph, Circle } from "tamagui";

interface TopBarProps {
  user?: {
    name?: string | null;
    image?: string | null;
  };
  isAuthenticated: boolean;
  onHomePress: () => void;
  onSignPress: () => void;
}

export default function TopBar({ user, isAuthenticated, onHomePress, onSignPress }: TopBarProps) {
  const getInitials = (name?: string | null) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("");
  };

  return (
    <XStack
      position="sticky"
      justify="space-between"
      items="center"
      gap="$2"
      width="100%"
      px="$3"
      py="$2"
    >
      <Button size="$3" circular icon={Home} onPress={onHomePress} />
      <XStack items="center" gap="$2">
        {isAuthenticated && user && (
          <XStack items="center" justify="center" gap="$2">
            {user.image ? (
              <Avatar circular size="$4">
                <Avatar.Image src={user.image} />
                <Avatar.Fallback bg="#3b82f6">
                  <Paragraph color="$background">{getInitials(user.name)}</Paragraph>
                </Avatar.Fallback>
              </Avatar>
            ) : (
              <Circle size="$4" bg="#3b82f6">
                <Paragraph color="$background">{getInitials(user.name)}</Paragraph>
              </Circle>
            )}
            <Paragraph size="$5" fontWeight="bold">
              {user.name}
            </Paragraph>
          </XStack>
        )}
        <Button size="$3" onPress={onSignPress}>
          {isAuthenticated ? "Sign Out" : "Sign In"}
        </Button>
      </XStack>
    </XStack>
  );
}
