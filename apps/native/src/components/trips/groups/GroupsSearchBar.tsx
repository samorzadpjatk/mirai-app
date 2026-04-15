import { Ionicons } from "@expo/vector-icons";
import { YStack, Input } from "@mirai-app/ui";

interface GroupsSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function GroupsSearchBar({ value, onChangeText }: GroupsSearchBarProps) {
  return (
    <YStack position="relative" marginBottom="$4">
      <YStack
        position="absolute"
        left="$4"
        zIndex={1}
        justifyContent="center"
        style={{ top: 0, bottom: 0 }}
      >
        <Ionicons
          name="search"
          size={20}
          color="#1EA2A0"
          style={{ opacity: 0.6 }}
        />
      </YStack>
      <Input
        backgroundColor="#111827"
        borderWidth={1}
        borderColor="rgba(255, 255, 255, 0.05)"
        borderRadius="$6"
        paddingVertical="$4"
        paddingLeft={48}
        paddingRight="$4"
        color="white"
        fontSize="$base"
        fontWeight="500"
        placeholder="Search groups by name..."
        placeholderTextColor="rgba(148, 163, 184, 0.4)"
        value={value}
        onChangeText={onChangeText}
      />
    </YStack>
  );
}
