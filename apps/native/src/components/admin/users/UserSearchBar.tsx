import { XStack, Input } from "tamagui";
import { Search } from "@tamagui/lucide-icons";

interface UserSearchBarProps {
    searchTerm: string;
    onSearchChange: (text: string) => void;
}

const UserSearchBar = ({ searchTerm, onSearchChange }: UserSearchBarProps) => {
    return (
        <XStack gap="$2" items="center">
            <XStack flex={1} items="center">
                <Input
                    flex={1}
                    placeholder="Search users..."
                    value={searchTerm}
                    onChangeText={(e) => onSearchChange(e.nativeEvent.text)}
                />
                <XStack position="absolute" r="$3" pointerEvents="none">
                    <Search size={16} />
                </XStack>
            </XStack>
        </XStack>
    );
};

export default UserSearchBar;
