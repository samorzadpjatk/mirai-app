'use client';

import { Select } from "@radix-ui/themes";

interface UserSearchFieldDropdownMenuProps {
    setField: (field: "name" | "email" | "wristNumber" | "houseNumber" | "groupName") => void;
}

const UserSearchFieldDropdownMenu = ({ setField }: UserSearchFieldDropdownMenuProps) => {
    return (
        <Select.Root defaultValue="name" onValueChange={(value) => { setField(value as "name" | "email" | "wristNumber" | "houseNumber" | "groupName") }}>
            <Select.Trigger placeholder="Select a search field" />
            <Select.Content>
                <Select.Item value="name">Name</Select.Item>
                <Select.Item value="email">Email</Select.Item>
                <Select.Item value="wristNumber">Wrist Number</Select.Item>
                <Select.Item value="houseNumber">House Number</Select.Item>
                <Select.Item value="groupName">Group Name</Select.Item>
            </Select.Content>
        </Select.Root>
    );
}

export default UserSearchFieldDropdownMenu;