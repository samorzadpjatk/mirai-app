import { XStack, Button, Paragraph } from "tamagui";
import { ChevronLeft, ChevronRight } from "@tamagui/lucide-icons";

interface UserPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const UserPagination = ({ currentPage, totalPages, onPageChange }: UserPaginationProps) => {
    return (
        <XStack justifyContent="space-between" alignItems="center" padding="$3" gap="$2">
            <Button
                size="$3"
                icon={<ChevronLeft size={16} />}
                onPress={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                Previous
            </Button>
            <Paragraph>
                Page {currentPage} of {totalPages}
            </Paragraph>
            <Button
                size="$3"
                iconAfter={<ChevronRight size={16} />}
                onPress={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                Next
            </Button>
        </XStack>
    );
};

export default UserPagination;
