import { Trash2, Star } from "@tamagui/lucide-icons";
import { Button, Spinner } from "tamagui";

interface ChangeUserAdminButtonProps {
    selectedUserId: string;
    user?: {
        id: string;
        isAdmin: boolean;
    };
    isLoading?: boolean;
    onToggleAdmin?: (userId: string, isAdmin: boolean) => void;
}

const ChangeUserAdminButton = ({ 
    selectedUserId, 
    user, 
    isLoading, 
    onToggleAdmin 
}: ChangeUserAdminButtonProps) => {
    if (!user || isLoading) return <Spinner />;
    
    const handleToggle = () => {
        if (onToggleAdmin) {
            onToggleAdmin(selectedUserId, !user.isAdmin);
        }
    };

    return (
        <Button
            size="$3"
            theme={user.isAdmin ? "red" : "blue"}
            onPress={handleToggle}
            disabled={isLoading}
            icon={user.isAdmin ? <Trash2 size={16} /> : <Star size={16} />}
        >
            {user.isAdmin ? "Remove admin" : "Assign admin"}
        </Button>
    );
}

export default ChangeUserAdminButton;
