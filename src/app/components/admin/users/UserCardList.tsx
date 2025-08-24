import { StarIcon, PersonIcon, MinusIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Flex, Card, DataList, Strong, Badge, Button, Text } from "@radix-ui/themes";
import type { QueryObserver } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import type { UserWithAllFields } from "~/types/schema";


const UserCardList = ({ users, setSelectedUser, setIsAssignDialogOpen, setIsRemoveDialogOpen, refetchUsers }: { users: UserWithAllFields[], setSelectedUser: (user: UserWithAllFields) => void, setIsAssignDialogOpen: (isOpen: boolean) => void, setIsRemoveDialogOpen: (isOpen: boolean) => void, refetchUsers: QueryObserver["refetch"] }) => {
    const updateAdminStatusMutation = api.user.updateUserAdminStatus.useMutation({
        onSuccess: async () => {
            await refetchUsers();
        },
    });

    return (
        <Flex direction="column" justify="center">
            {users?.length === 0 && (
                <Card style={{ padding: "1rem" }}>
                    <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
                        Brak użytkowników do wyświetlenia
                    </Text>
                </Card>
            )}
            {users?.map((user) => (
                <Card size={{ "initial": "2" }} key={user.id}>
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
                                <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
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
                                    <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
                                        Brak gildii
                                    </Text>
                                )}
                            </DataList.Value>
                        </DataList.Item>
                        <DataList.Item>
                            <DataList.Label>Akcje</DataList.Label>
                            <DataList.Value>
                                <Flex direction={"column"} gap="2">
                                    {!user.organizerGroup && (
                                        <Button
                                            size={{ "initial": "1" }}
                                            variant="soft"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                if (user.group != null) {
                                                    setIsRemoveDialogOpen(true);
                                                } else {
                                                    setIsAssignDialogOpen(true);
                                                }
                                            }}
                                        > {user.group ? (
                                            <>
                                                <MinusIcon />
                                                Usuń z gildii
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon />
                                                Dodaj do gildii
                                            </>
                                        )}
                                        </Button>)}
                                    <Button
                                        size={{ "initial": "1" }}
                                        variant="soft"
                                        color={user.isAdmin ? "red" : "blue"}
                                        onClick={() => updateAdminStatusMutation.mutate({
                                            userId: user.id,
                                            isAdmin: !user.isAdmin
                                        })}
                                        disabled={updateAdminStatusMutation.isPending}
                                    >
                                        {user.isAdmin ? <><TrashIcon />Usuń admin</> : <><StarIcon />Nadaj admin</>}
                                    </Button>
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
