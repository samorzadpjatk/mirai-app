import { StarIcon, PersonIcon } from "@radix-ui/react-icons";
import { Flex, Card, Strong, Badge, Text, Skeleton, DataList } from "@radix-ui/themes";
import ChangeUserAdminButton from "../admin/users/ChangeUserAdminButton";
import AssignUserToGroupFormDialog from "../admin/users/dialog/AssignUserToGroupFormDialog";
import RemoveUserFromGroupFormDialog from "../admin/users/dialog/RemoveUserFromGroupFormDialog";


const UserCardListSkelethon = () => {
    const user = {
        id: "1",
        name: "Jan Kowalski",
        email: "jan.kowalski@example.com",
        isAdmin: true,
        group: {
            id: "1",
            name: "Grupa 1"
        },
        organizerGroup: {
            id: "1",
            name: "Organizator 1"
        }
    }
    return (
        <Card size={{ "initial": "1", "xs": "2", "sm": "3" }} key={user.id}>
            <DataList.Root>
                <DataList.Item>
                    <DataList.Label>Użytkownik</DataList.Label>
                    <DataList.Value>
                        <Skeleton loading={true}>
                            <Strong>{user.name}</Strong>
                        </Skeleton>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label>Email</DataList.Label>
                    <DataList.Value>
                        <Skeleton loading={true}>
                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                                {user.email}
                            </Text>
                        </Skeleton>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label>Status</DataList.Label>
                    <DataList.Value>
                        <Flex direction={"column"} gap="2">
                            {user.isAdmin && (
                                <Skeleton loading={true}>
                                    <Badge variant="solid" color="gold">
                                        <StarIcon />
                                        Admin
                                    </Badge>
                                </Skeleton>
                            )}
                            <Skeleton loading={true}>
                                <Badge variant="soft" color="blue">
                                    <PersonIcon />
                                    Użytkownik
                                </Badge>
                            </Skeleton>
                        </Flex>
                    </DataList.Value>
                </DataList.Item><DataList.Item>
                    <DataList.Label>Gildie</DataList.Label>
                    <DataList.Value>
                        {user.group != null && (
                            <Skeleton loading={true}>
                                <Badge key={user.group.id} variant="soft" color="purple">
                                    {user.group.name}
                                </Badge>
                            </Skeleton>
                        )}
                        {user.organizerGroup != null && (
                            <Skeleton loading={true}>
                                <Badge key={user.organizerGroup.id} variant="solid" color="purple">
                                    {user.organizerGroup.name}
                                </Badge>
                            </Skeleton>
                        )}
                        {user.group == null && user.organizerGroup == null && (
                            <Skeleton loading={true}>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                                    Brak gildii
                                </Text>
                            </Skeleton>
                        )}
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label>Akcje</DataList.Label>
                    <DataList.Value>
                        <Flex direction={"column"} gap="2">
                            {user.group == null && user.organizerGroup == null && (
                                <Skeleton loading={true}>
                                    <AssignUserToGroupFormDialog
                                        selectedUserId={user.id}
                                    />
                                </Skeleton>
                            )}
                            {user.group != null && (
                                <Skeleton loading={true}>
                                    <RemoveUserFromGroupFormDialog
                                        selectedUserId={user.id}
                                    />
                                </Skeleton>
                            )}
                            <Skeleton loading={true}>
                                <ChangeUserAdminButton selectedUserId={user.id} />
                            </Skeleton>
                        </Flex>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
        </Card>
    );
}

export default UserCardListSkelethon;
