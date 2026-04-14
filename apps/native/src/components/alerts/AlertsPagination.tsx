import { XStack, Text, Button } from "@mirai-app/ui";

interface AlertsPaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function AlertsPagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: AlertsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      marginTop="$6"
      paddingTop="$6"
      borderTopWidth={1}
      borderTopColor="rgba(255, 255, 255, 0.05)"
    >
      <Button
        variant="outlined"
        size="$2"
        onPress={onPrev}
        disabled={page === 1}
        opacity={page === 1 ? 0.3 : 1}
      >
        Previous
      </Button>
      <Text fontSize="$3" color="#9ca3af">
        Page {page} of {totalPages}
      </Text>
      <Button
        variant="outlined"
        size="$2"
        onPress={onNext}
        disabled={page === totalPages}
        opacity={page === totalPages ? 0.3 : 1}
      >
        Next
      </Button>
    </XStack>
  );
}
