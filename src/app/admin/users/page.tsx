import {
    Flex,
    Heading,
    Text,
} from "@radix-ui/themes";
import UserCardList from "~/components/admin/users/UserCardList";

export default function UserManagement() {

    return (
        <Flex direction="column" gap="2" style={{ marginTop: "0.5em" }}>
            {/* Header */}
            <Flex direction="column" gap={"2"} justify="between">
                <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>User Management</Heading>
                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>
                    Manage guild membership and user permissions
                </Text>
            </Flex>

            {/* Users CardList */}
            <UserCardList />
        </Flex>
    );
}
