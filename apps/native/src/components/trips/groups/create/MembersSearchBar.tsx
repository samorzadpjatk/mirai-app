import { Ionicons } from "@expo/vector-icons";
import { YStack } from "@mirai-app/ui";
import { Input } from "tamagui";

interface MembersSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function MembersSearchBar({
  value,
  onChangeText,
}: MembersSearchBarProps) {
  return (
    <YStack position="relative" marginBottom="$4">
      <YStack
        position="absolute"
        left="$4"
        top={0}
        bottom={0}
        justifyContent="center"
        zIndex={1}
      >
        <Ionicons name="search" size={20} color="rgba(148, 163, 184, 0.6)" />
      </YStack>
      <Input
        placeholder="Search by name"
        placeholderTextColor="rgba(148, 163, 184, 0.4)"
        value={value}
        onChangeText={onChangeText}
        backgroundColor="$card"
        borderWidth={1}
        borderColor="rgba(48, 54, 61, 1)"
        borderRadius="$2"
        paddingVertical="$3"
        paddingLeft={48}
        paddingRight="$4"
        color="$colorStrong"
        fontSize="$2"
      />
    </YStack>
  );
}
