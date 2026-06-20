import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "./common/CachedImage";

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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <View className="flex-row justify-between items-center gap-2 w-full px-3 py-2">
      <TouchableOpacity
        onPress={onHomePress}
        className="w-10 h-10 rounded-full bg-surface-dark items-center justify-center"
      >
        <Ionicons name="home" size={20} color="#00ced1" />
      </TouchableOpacity>

      <View className="flex-row items-center gap-2">
        {isAuthenticated && user && (
          <View className="flex-row items-center justify-center gap-2">
            {user.image ? (
              <CachedImage
                source={{ uri: user.image }}
                className="w-8 h-8 rounded-full"
                accessibilityLabel="User avatar"
                contentFit="cover"
              />
            ) : (
              <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white text-sm font-semibold">{getInitials(user.name)}</Text>
              </View>
            )}
            <Text className="text-white text-base font-bold">{user.name}</Text>
          </View>
        )}
        <TouchableOpacity onPress={onSignPress} className="px-4 py-2 bg-surface-dark rounded-lg">
          <Text className="text-white font-medium">{isAuthenticated ? "Sign Out" : "Sign In"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
