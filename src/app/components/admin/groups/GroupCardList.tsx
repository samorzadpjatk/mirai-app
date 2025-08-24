import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { Flex, Card, Strong, Badge, Button, Text } from "@radix-ui/themes";
import type { GroupWithAllFields } from "~/types/schema";
import type { Group } from "@prisma/client";

const GroupCardList = ({ groups, setSelectedGroup, setIsEditDialogOpen, setIsDeleteDialogOpen }: { groups: GroupWithAllFields[]; setSelectedGroup: (group: Group | null) => void; setIsEditDialogOpen: (open: boolean) => void; setIsDeleteDialogOpen: (open: boolean) => void; }) => {
    return (
        <Flex direction="column" justify="center">
            {groups?.length === 0 && (
                <Card style={{ padding: "1rem" }}>
                    <Text size={{ "initial": "1" }} style={{ opacity: 0.6 }}>
                        Brak gildii do wyświetlenia
                    </Text><br />
                    <Text size={{ "initial": "1" }} style={{ opacity: 0.5 }}>
                        Utwórz pierwszą gildię, aby rozpocząć zarządzanie
                    </Text>
                </Card>
            )}
            {groups?.map((group) => (
                <Card key={group.id} size={{ "initial": "2" }} style={{ width: "100%", maxWidth: "500px" }}>
                    <Flex direction="column" gap={{ "initial": "1" }}>
                        <Flex justify="between" align="center">
                            <Strong>{group.name}</Strong>
                            <Badge variant="soft" color="blue">
                                {group.code}
                            </Badge>
                        </Flex>
                        <Text size={{ "initial": "1" }} style={{ opacity: 0.7 }}>
                            Przypisany: {(group.organizer.name ?? group.organizer.email) ?? "Nieznany"}
                        </Text>
                        <Flex justify="between" align="center">
                            <Badge variant="soft" color="green">
                                {group.members.length} członków
                            </Badge>
                            <Badge variant="soft" color="gold">
                                💰 {group.coins} monet
                            </Badge>
                        </Flex>
                        <Flex gap={{ "initial": "1" }} justify="end">
                            <Button
                                size={{ "initial": "1" }}
                                variant="soft"
                                onClick={() => {
                                    setSelectedGroup(group);
                                    setIsEditDialogOpen(true);
                                }}
                            >
                                <Pencil1Icon />
                            </Button>
                            <Button
                                size={{ "initial": "1" }}
                                variant="soft"
                                color="red"
                                onClick={() => {
                                    setSelectedGroup(group);
                                    setIsDeleteDialogOpen(true);
                                }}
                            >
                                <TrashIcon />
                            </Button>
                        </Flex>
                    </Flex>
                </Card>
            ))}
        </Flex>
    );
}

export default GroupCardList;
