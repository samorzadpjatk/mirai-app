import { StarIcon, PersonIcon } from "@radix-ui/react-icons";
import { Flex, Card, DataList, Strong, Badge, Text } from "@radix-ui/themes";
import { api } from "~/trpc/server";
import AssignUserToGroupFormDialog from "./dialog/AssignUserToGroupFormDialog";
import RemoveUserFromGroupFormDialog from "./dialog/RemoveUserFromGroupFormDialog";
import ChangeUserAdminButton from "./ChangeUserAdminButton";
import WristNumberManager from "./WristNumberManager";
import { Suspense } from "react";
import UserCardListSkelethon from "~/components/skelethons/UserCardListSkelethon";

const UserCardList = async () => {
    const users = await api.user.getAll();

    return (
        <Suspense fallback={<UserCardListSkelethon />}>
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
                                    <Strong>{user.name}</Strong>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Email</DataList.Label>
                                <DataList.Value>
                                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                                        {user.email}
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
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Numer opaski</DataList.Label>
                                <DataList.Value>
                                    {user.wristNumber ? (
                                        <Badge variant="soft" color="green">
                                            {user.wristNumber}
                                        </Badge>
                                    ) : (
                                        <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                                            Nie przypisano
                                        </Text>
                                    )}
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Gildie</DataList.Label>
                                <DataList.Value>
                                    <Flex gap="2" wrap="wrap">
                                        {user.groups.map((userGroup) => (
                                            <Badge key={userGroup.group.id} variant="soft" color="purple">
                                                {userGroup.group.name}
                                            </Badge>
                                        ))}
                                        {user.organizerGroups.map((organizerGroup) => (
                                            <Badge key={organizerGroup.id} variant="solid" color="purple">
                                                {organizerGroup.name}
                                            </Badge>
                                        ))}
                                        {user.groups.length === 0 && user.organizerGroups.length === 0 && (
                                            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.6 }}>
                                                Brak gildii
                                            </Text>
                                        )}
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label>Akcje</DataList.Label>
                                <DataList.Value>
                                    <Flex direction={"column"} gap="2">
                                        {user.groups.length === 0 && user.organizerGroups.length === 0 && (
                                            <AssignUserToGroupFormDialog
                                                selectedUserId={user.id}
                                            />
                                        )}
                                        {user.groups.length > 0 && (
                                            <RemoveUserFromGroupFormDialog
                                                selectedUserId={user.id}
                                            />
                                        )}
                                        <WristNumberManager 
                                            userId={user.id}
                                            userName={user.name || "Nieznany użytkownik"}
                                            currentWristNumber={user.wristNumber}
                                        />
                                        <ChangeUserAdminButton selectedUserId={user.id} />
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item>
                        </DataList.Root>
                    </Card>
                ))}
            </Flex>
        </Suspense>
    );
};

export default UserCardList;
