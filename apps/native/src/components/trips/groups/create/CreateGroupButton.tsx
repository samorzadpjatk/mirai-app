import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";

interface CreateGroupButtonProps {
  isSubmitting: boolean;
  onPress: () => void;
}

export function CreateGroupButton({
  isSubmitting,
  onPress,
}: CreateGroupButtonProps) {
  return (
    <PrimaryLoadingButton
      label="Create Group"
      isLoading={isSubmitting}
      onPress={onPress}
      testID="create-group-button"
    />
  );
}
