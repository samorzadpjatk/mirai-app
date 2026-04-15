import { PrimaryLoadingButton } from "../../../common/buttons/PrimaryLoadingButton";

interface SaveGroupButtonProps {
  isSubmitting: boolean;
  onPress: () => void;
}

export function SaveGroupButton({
  isSubmitting,
  onPress,
}: SaveGroupButtonProps) {
  return (
    <PrimaryLoadingButton
      label="Save Changes"
      isLoading={isSubmitting}
      onPress={onPress}
    />
  );
}
