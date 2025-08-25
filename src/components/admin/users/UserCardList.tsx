import { StarIcon, PersonIcon } from "@radix-ui/react-icons";
import { Flex, Card, DataList, Strong, Badge, Text } from "@radix-ui/themes";
import { api } from "~/trpc/server";
import AssignUserToGroupFormDialog from "./dialog/AssignUserToGroupFormDialog";
import RemoveUserFromGroupFormDialog from "./dialog/RemoveUserFromGroupFormDialog";
import ChangeUserAdminButton from "./ChangeUserAdminButton";

const UserCardList = async () => {
    const users = await api.user.getAll();

    return (
        <Flex direction="column" justify="center">
            {users?.length === 0 && (
                <Card style={{ padding: "1rem" }}>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                        Brak użytkowników do wyświetlenia
                    </Text>
                </Card>
            )}
            {users?.map((user) => (
                <Card size={{ "initial": "1", "xs": "2", "sm": "3" }} key={user.id}>
                    <DataList.Root>
                        <DataList.Item>
                            <DataList.Label>Użytkownik</DataList.Label>
                            <DataList.Value>
                                <Strong>{user.name ?? "Nieznany użytkownik"}</Strong>
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Email</DataList.Label>
                            <DataList.Value>
                                <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                                    {user.email ?? "Brak email"}
                                </Text>
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Status</DataList.Label>
                            <DataList.Value>
                                <Flex direction={"column"} gap="2">
                                    {user.isAdmin && (
                                        <Badge variant="solid" color="gold">
                                            <StarIcon />
                                            Admin
                                        </Badge>
                                    )}
                                    <Badge variant="soft" color="blue">
                                        <PersonIcon />
                                        Użytkownik
                                    </Badge>
                                </Flex>
                            </DataList.Value>
                        </DataList.Item><DataList.Item>
                            <DataList.Label>Gildie</DataList.Label>
                            <DataList.Value>
                                {user.group != null && (
                                    <Badge key={user.group.id} variant="soft" color="purple">
                                        {user.group.name}
                                    </Badge>
                                )}
                                {user.organizerGroup != null && (
                                    <Badge key={user.organizerGroup.id} variant="solid" color="purple">
                                        {user.organizerGroup.name}
                                    </Badge>
                                )}
                                {user.group == null && user.organizerGroup == null && (
                                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                                        Brak gildii
                                    </Text>
                                )}
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Akcje</DataList.Label>
                            <DataList.Value>
                                <Flex direction={"column"} gap="2">
                                    {user.group == null && user.organizerGroup == null && (
                                        <AssignUserToGroupFormDialog
                                            selectedUserId={user.id}
                                        />
                                    )}
                                    {user.group != null && (
                                        <RemoveUserFromGroupFormDialog
                                            selectedUserId={user.id}
                                        />
                                    )}
                                    <ChangeUserAdminButton selectedUserId={user.id} />
                                </Flex>
                            </DataList.Value>
                        </DataList.Item>
                    </DataList.Root>
                </Card>
            ))}
        </Flex>
    );
};

export default UserCardList;
