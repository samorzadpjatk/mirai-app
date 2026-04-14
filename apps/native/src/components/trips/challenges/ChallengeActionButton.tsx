import { Button, XStack } from "@mirai-app/ui";
import { Ionicons } from "@expo/vector-icons";

interface ChallengeActionButtonProps {
  isLoading: boolean;
  onPress: () => void;
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export function ChallengeActionButton({
  isLoading,
  onPress,
  label,
  iconName = "camera",
  disabled = false,
}: ChallengeActionButtonProps) {
  const buttonLabel =
    label ?? (isLoading ? "Loading..." : "Take Challenge Photo");
  const isDisabled = isLoading || disabled;

  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      disabled={isDisabled}
      isLoading={isLoading}
      onPress={onPress}
      leftIcon={
        <Ionicons
          name={iconName}
          size={24}
          color={isDisabled ? "#475569" : "#17181c"}
        />
      }
      marginBottom="$3"
    >
      {buttonLabel}
    </Button>
  );
}
