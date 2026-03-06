import { FloatingActionButton } from "~/components/common/FloatingActionButton";

interface EditGroupButtonProps {
  onPress: () => void;
}

export function EditGroupButton({ onPress }: EditGroupButtonProps) {
  return (
    <FloatingActionButton
      onPress={onPress}
      iconName="create"
      iconSize={28}
      activeOpacity={0.7}
      accessibilityLabel="Edit group"
    />
  );
}
