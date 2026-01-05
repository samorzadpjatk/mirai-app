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
          
          onPress={() => onNavigate("groups")}
        >
          <Paragraph>🏛️ Guilds</Paragraph>
        </Button>
        <Button
          size="$3"
          
          onPress={() => onNavigate("users")}
        >
          <Paragraph>👥 Companions</Paragraph>
        </Button>
        <Button
          size="$3"
          
          onPress={() => onNavigate("coins")}
        >
          <Paragraph>💰 Coins</Paragraph>
        </Button>
        <Button
          size="$3"
          
          onPress={() => onNavigate("transactions")}
        >
          <Paragraph>📊 History</Paragraph>
        </Button>
        {isAdmin && (
          <Button
            size="$3"
            
            onPress={() => onNavigate("schedules")}
          >
            <Paragraph>🔔 Schedules</Paragraph>
          </Button>
        )}
        <Button
          size="$3"
          
          onPress={() => onNavigate("notifications")}
        >
          <Paragraph>📨 Notifications</Paragraph>
        </Button>
      </XStack>
    );
}

export default AdminNavMenu;