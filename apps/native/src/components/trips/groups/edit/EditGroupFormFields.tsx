import { YStack, Text, Input } from "@mirai-app/ui";

interface EditGroupFormFieldsProps {
  groupName: string;
  onChangeName: (value: string) => void;
}

export function EditGroupFormFields({
  groupName,
  onChangeName,
}: EditGroupFormFieldsProps) {
  return (
    <YStack marginBottom="$5">
      <Text
        fontSize={10}
        fontWeight="700"
        color="rgba(148, 163, 184, 0.6)"
        textTransform="uppercase"
        letterSpacing={1.5}
        marginBottom="$2"
        marginLeft="$1"
      >
        Group Name
      </Text>
      <Input
        placeholder="Enter group name"
        placeholderTextColor="rgba(148, 163, 184, 0.4)"
        value={groupName}
        onChangeText={onChangeName}
        backgroundColor="rgba(33, 38, 45, 1)"
        borderWidth={1}
        borderColor="rgba(48, 54, 61, 1)"
        borderRadius="$6"
        paddingVertical="$3"
        paddingHorizontal="$5"
        color="white"
        fontSize={14}
      />
    </YStack>
  );
}
