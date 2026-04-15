import { TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { YStack, XStack } from "@mirai-app/ui";

interface EditMembersSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function EditMembersSearchBar({
  value,
  onChangeText,
}: EditMembersSearchBarProps) {
  return (
    <YStack position="relative" marginBottom="$4">
      <XStack
        position="absolute"
        left="$4"
        top={0}
        bottom={0}
        justifyContent="center"
        zIndex={1}
        alignItems="center"
      >
        <Ionicons name="search" size={20} color="#475569" />
      </XStack>
      <TextInput
        placeholder="Search by name"
        placeholderTextColor="rgba(148, 163, 184, 0.4)"
        value={value}
        onChangeText={onChangeText}
        style={{
          backgroundColor: "rgba(33, 38, 45, 1)",
          borderWidth: 1,
          borderColor: "rgba(48, 54, 61, 1)",
          borderRadius: 12,
          paddingVertical: 12,
          paddingLeft: 48,
          paddingRight: 16,
          color: "white",
          fontSize: 14,
        }}
      />
    </YStack>
  );
}
