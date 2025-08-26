import {
    Flex,
    Heading
} from "@radix-ui/themes";

import CreateGroupDialog from "~/components/admin/groups/dialog/CreateGroupDialog";
import GroupCardList from "~/components/admin/groups/GroupCardList";

const GroupManagement = () => {
    return (
        <Flex direction="column" gap={{ "initial": "1" }} style={{ marginTop: "0.5em" }}>
            <Flex justify="between" align="center">
                <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Zarządzanie Gildiami</Heading>
                <CreateGroupDialog />
            </Flex>
            <GroupCardList />
        </Flex>
    );
}

export default GroupManagement;
