import { XStack, YStack, Text } from "@mirai-app/ui";
import { Image } from "expo-image";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TopBarProps {
  user?: {
    name?: string | null;
    image?: string | null;
  };
  isAuthenticated: boolean;
  onHomePress: () => void;
  onSignPress: () => void;
}

export default function TopBar({
  user,
  isAuthenticated,
  onHomePress,
  onSignPress,
}: TopBarProps) {
  const getInitials = (name?: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <XStack
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      gap={8}
      width="100%"
      paddingHorizontal={12}
      paddingVertical={8}
    >
      <TouchableOpacity onPress={onHomePress}>
        <XStack
          width={40}
          height={40}
          borderRadius={9999}
          backgroundColor="#272935"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="home" size={20} color="#00ced1" />
        </XStack>
      </TouchableOpacity>

      <XStack alignItems="center" gap={8}>
        {isAuthenticated && user && (
          <XStack alignItems="center" justifyContent="center" gap={8}>
            {user.image ? (
              <Image
                source={{ uri: user.image }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
            ) : (
              <YStack
                width={32}
                height={32}
                borderRadius={9999}
                backgroundColor="#3b82f6"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="white" fontSize={12} fontWeight="600">
                  {getInitials(user.name)}
                </Text>
              </YStack>
            )}
            <Text color="white" fontSize={16} fontWeight="700">
              {user.name}
            </Text>
          </XStack>
        )}
        <TouchableOpacity onPress={onSignPress}>
          <XStack
            paddingHorizontal={16}
            paddingVertical={8}
            backgroundColor="#272935"
            borderRadius={8}
          >
            <Text color="white" fontWeight="500">
              {isAuthenticated ? "Sign Out" : "Sign In"}
            </Text>
          </XStack>
        </TouchableOpacity>
      </XStack>
    </XStack>
  );
}
