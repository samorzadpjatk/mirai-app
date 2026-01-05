import { RefreshCw } from "@tamagui/lucide-icons";
import { Button } from "tamagui";

interface RefreshButtonProps {
  onRefresh: () => void;
}

const RefreshButton = ({ onRefresh }: RefreshButtonProps) => {
    return (
        <Button
            size="$3"
            icon={RefreshCw}
            onPress={onRefresh}
        >
            Refresh
        </Button>
    );
}

export default RefreshButton;
