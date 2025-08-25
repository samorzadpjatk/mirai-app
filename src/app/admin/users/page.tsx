import {
    Flex,
    Heading,
    Text,
} from "@radix-ui/themes";
import { Suspense } from "react";
import UserCardList from "~/components/admin/users/UserCardList";

export default function UserManagement() {

    return (
        <Suspense fallback={<Flex direction="column" align="center" justify="center" style={{ width: "100%", padding: "1rem" }}>
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>Ładowanie użytkowników...</Text>
        </Flex>}>
            <Flex direction="column" gap="2" style={{ marginTop: "0.5em" }}>
                {/* Header */}
                <Flex direction="column" gap={"2"} justify="between">
                    <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }}>Zarządzanie Użytkownikami</Heading>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>
                        Zarządzaj członkostwem w gildiach i uprawnieniami użytkowników
                    </Text>
                </Flex>

                {/* Users CardList */}
                <UserCardList />
            </Flex>
        </Suspense >
    );
}
