import { XStack, Button, Paragraph } from "tamagui";

interface AdminNavMenuProps {
  isAdmin: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const AdminNavMenu = ({ isAdmin, currentPath, onNavigate }: AdminNavMenuProps) => {
    return (
      <XStack gap="$2" flexWrap="wrap">
        <Button
          size="$3"
          theme={currentPath.includes("groups") ? "active" : undefined}
          onPress={() => onNavigate("groups")}
        >
          <Paragraph>🏛️ Guilds</Paragraph>
        </Button>
        <Button
          size="$3"
          theme={currentPath.includes("users") ? "active" : undefined}
          onPress={() => onNavigate("users")}
        >
          <Paragraph>👥 Companions</Paragraph>
        </Button>
        <Button
          size="$3"
          theme={currentPath.includes("coins") ? "active" : undefined}
          onPress={() => onNavigate("coins")}
        >
          <Paragraph>💰 Coins</Paragraph>
        </Button>
        <Button
          size="$3"
          theme={currentPath.includes("transactions") ? "active" : undefined}
          onPress={() => onNavigate("transactions")}
        >
          <Paragraph>📊 History</Paragraph>
        </Button>
        {isAdmin && (
          <Button
            size="$3"
            theme={currentPath.includes("schedules") ? "active" : undefined}
            onPress={() => onNavigate("schedules")}
          >
            <Paragraph>🔔 Schedules</Paragraph>
          </Button>
        )}
        <Button
          size="$3"
          theme={currentPath.includes("notifications") ? "active" : undefined}
          onPress={() => onNavigate("notifications")}
        >
          <Paragraph>📨 Notifications</Paragraph>
        </Button>
      </XStack>
    );
}

export default AdminNavMenu;