import { YStack } from "@mirai-app/ui";
import { PrimaryAddButton } from "~/components/common/buttons/PrimaryAddButton";

interface GroupsCreateButtonProps {
  onPress: () => void;
}

export function GroupsCreateButton({ onPress }: GroupsCreateButtonProps) {
  return (
    <YStack marginBottom="$4">
      <PrimaryAddButton onPress={onPress} />
    </YStack>
  );
}
