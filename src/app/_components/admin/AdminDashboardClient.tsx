"use client";

import { Card, Flex, Heading, Text, Separator, Tabs, Container } from "@radix-ui/themes";
import NoSSR from "./NoSSR";

// Import admin dashboard components
import GroupManagement from "./GroupManagement";
import UserManagement from "./UserManagement";
import CoinManagement from "./CoinManagement";
import TransactionHistory from "./TransactionHistory";

interface AdminDashboardClientProps {
    userName: string | null | undefined;
}

export default function AdminDashboardClient({ userName }: AdminDashboardClientProps) {
    return (
        <NoSSR fallback={
            <Container size="4">
                <Flex direction="column" align="center" justify="center" style={{ minHeight: "60vh" }}>
                    <Text>Ładowanie panelu administratora...</Text>
                </Flex>
            </Container>
        }>
            <Container size="4">
                <Flex direction="column" gap="6" style={{ padding: "2rem 0" }}>
                    {/* Header */}
                    <Card size="4">
                        <Flex direction="column" align="center" gap="3">
                            <Heading size="7" style={{ fontFamily: "var(--font-robotoslab)" }}>
                                🏰 Panel Administratora
                            </Heading>
                            <Text size="4" align="center" style={{ opacity: 0.8 }}>
                                Zarządzaj Gildiami, użytkownikami i monetami w Królestwie
                            </Text>
                            <Text size="2" style={{ opacity: 0.6 }}>
                                Witaj, {userName}! Twoje królestwo czeka na zarządzanie.
                            </Text>
                        </Flex>
                    </Card>

                    {/* Admin Dashboard Tabs */}
                    <Card size="4">
                        <Tabs.Root defaultValue="groups">
                            <Tabs.List size="2">
                                <Tabs.Trigger value="groups">🏛️ Gildie</Tabs.Trigger>
                                <Tabs.Trigger value="users">👥 Użytkownicy</Tabs.Trigger>
                                <Tabs.Trigger value="coins">💰 Monety</Tabs.Trigger>
                                <Tabs.Trigger value="transactions">📊 Historia</Tabs.Trigger>
                            </Tabs.List>

                            <Separator my="4" size="4" />

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
            </Container>
        </NoSSR>
    );
}
