import {
    Flex,
    Heading, Text
} from "@radix-ui/themes";
import { Suspense } from "react";

import CreateGroupDialog from "~/components/admin/groups/dialog/CreateGroupDialog";
import GroupCardList from "~/components/admin/groups/GroupCardList";

const GroupManagement = () => {
    return (
        <Suspense fallback={<Flex direction="column" align="center" justify="center" style={{ width: "100%", padding: "1rem" }}>
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>Ładowanie gildii...</Text>
        </Flex>}>
            <Flex direction="column" gap={{ "initial": "1" }} style={{ marginTop: "0.5em" }}>
                <Flex justify="between" align="center">
                    <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Zarządzanie Gildiami</Heading>
                    <CreateGroupDialog />
                </Flex>
                <GroupCardList />
            </Flex></Suspense>
    );
}

export default GroupManagement;
