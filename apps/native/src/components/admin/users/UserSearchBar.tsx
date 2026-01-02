import { XStack, Input } from "tamagui";
import { Search } from "@tamagui/lucide-icons";

interface UserSearchBarProps {
    searchTerm: string;
    onSearchChange: (text: string) => void;
}

const UserSearchBar = ({ searchTerm, onSearchChange }: UserSearchBarProps) => {
    return (
        <XStack gap="$2" alignItems="center">
            <Input
                flex={1}
                placeholder="Search users..."
                value={searchTerm}
                onChangeText={onSearchChange}
                icon={<Search size={16} />}
            />
        </XStack>
    );
};

export default UserSearchBar;
