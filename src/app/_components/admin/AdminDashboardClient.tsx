"use client";

import { Card, Flex, Heading, Text, Tabs } from "@radix-ui/themes";
import NoSSR from "./NoSSR";

// Import admin dashboard components
import GroupManagement from "./GroupManagement";
import UserManagement from "./UserManagement";
import CoinManagement from "./CoinManagement";
import TransactionHistory from "./TransactionHistory";

export default function AdminDashboardClient() {
    return (
        <NoSSR fallback={
                <Flex direction="column" align="center" justify="center" style={{ height: '100%' }}>
                    <Text>Ładowanie panelu administratora...</Text>
                </Flex>
        }>
                <Flex direction="column" gap={{"initial":"1"}}>
                    {/* Header */}
                    <Card size={{"initial":"1"}}>
                        <Flex direction="column" align="center" gap="3">
                            <Heading size={{"initial":"4"}} style={{ fontFamily: "var(--font-robotoslab)" }}>
                                🏰 Panel Administratora
                            </Heading>
                            <Text size={{"initial":"2"}} align="center" style={{ opacity: 0.8 }}>
                                Zarządzaj Gildiami, użytkownikami i monetami w Królestwie
                            </Text>
                        </Flex>
                    </Card>

                    {/* Admin Dashboard Tabs */}
                    <Card size={{"initial":"1"}}>
                        <Tabs.Root defaultValue="groups">
                            <Tabs.List size={{"initial":"1"}}>
                                <Tabs.Trigger value="groups">🏛️ Gildie</Tabs.Trigger>
                                <Tabs.Trigger value="users">👥 Użytkownicy</Tabs.Trigger>
                                <Tabs.Trigger value="coins">💰 Monety</Tabs.Trigger>
                                <Tabs.Trigger value="transactions">📊 Historia</Tabs.Trigger>
                            </Tabs.List>

                            <Tabs.Content value="groups">
                                <GroupManagement />
                            </Tabs.Content>

                            <Tabs.Content value="users">
                                <UserManagement />
                            </Tabs.Content>

                            <Tabs.Content value="coins">
                                <CoinManagement />
                            </Tabs.Content>

                            <Tabs.Content value="transactions">
                                <TransactionHistory />
                            </Tabs.Content>
                        </Tabs.Root>
                    </Card>
                </Flex>
        </NoSSR>
    );
}
