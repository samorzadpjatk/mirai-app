import { Select, Adapt, Sheet } from "tamagui";

type SearchField = "name" | "email" | "wristNumber" | "houseNumber" | "groupName";

interface UserSearchFieldDropdownMenuProps {
    onValueChange: (field: SearchField) => void;
}

const UserSearchFieldDropdownMenu = ({ onValueChange }: UserSearchFieldDropdownMenuProps) => {
    return (
        <Select defaultValue="name" onValueChange={onValueChange}>
            <Select.Trigger width="$15" iconAfter={null}>
                <Select.Value placeholder="Select a search field" />
            </Select.Trigger>

            <Adapt when={true} platform="touch">
                <Sheet modal dismissOnSnapToBottom>
                    <Sheet.Frame>
                        <Sheet.ScrollView>
                            <Adapt.Contents />
                        </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                </Sheet>
            </Adapt>

            <Select.Content zIndex={200000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                    <Select.Item value="name" index={0}>
                        <Select.ItemText>Name</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="email" index={1}>
                        <Select.ItemText>Email</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="wristNumber" index={2}>
                        <Select.ItemText>Wrist Number</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="houseNumber" index={3}>
                        <Select.ItemText>House Number</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="groupName" index={4}>
                        <Select.ItemText>Group Name</Select.ItemText>
                    </Select.Item>
                </Select.Viewport>
                <Select.ScrollDownButton />
            </Select.Content>
        </Select>
    );
}

export default UserSearchFieldDropdownMenu;
