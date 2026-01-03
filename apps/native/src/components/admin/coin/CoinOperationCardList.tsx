import { Search } from "@tamagui/lucide-icons";
import { Card, H3, YStack, XStack, Paragraph, Input } from "tamagui";
import { Badge } from "../../Badge";
import { Suspense, useState } from "react";
import CoinOperationCardListSkeleton from "~/components/skelethons/CoinOperationCardListSkelethon";

interface CoinTransaction {
    id: string;
    amount: number;
    admin: {
        name: string | null;
    };
}

interface Group {
    id: string;
    name: string;
    coins: number;
    organizer: {
        name: string | null;
    };
    members: Array<{ id: string }>;
    coinTransactions: CoinTransaction[];
}

interface CoinOperationCardListProps {
    groups?: Group[];
    isLoading?: boolean;
}

const CoinOperationCardList = ({ groups, isLoading }: CoinOperationCardListProps) => {
    const [filterText, setFilterText] = useState("");

    if (isLoading) {
        return <CoinOperationCardListSkeleton />;
    }

    if (!groups) return null;

    const filteredGroups = groups.filter((group) =>
        group.name.toLowerCase().includes(filterText.toLowerCase()) ||
        group.organizer.name?.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
        <Suspense fallback={<CoinOperationCardListSkeleton />}>
            <YStack gap="$4">
                <H3>Coins in Possession</H3>
                <Input
                    placeholder="Filter Guilds..."
                    value={filterText}
                    onChangeText={setFilterText}
                    icon={<Search size={16} />}
                />
                <YStack justifyContent="center" gap="$3">
                    {filteredGroups?.length === 0 && (
                        <YStack>
                            <Paragraph opacity={0.6}>
                                The realm holds no guilds to display.
                            </Paragraph>
                            <Paragraph opacity={0.5}>
                                Begin by creating a guild under the "Guilds" section;
                            </Paragraph>
                        </YStack>
                    )}
                    {filteredGroups
                        ?.sort((a, b) => b.coins - a.coins)
                        .map((group, index) => (
                            <Card key={group.id} bordered padding="$3">
                                <YStack gap="$2">
                                    <XStack justifyContent="space-between" alignItems="center">
                                        <Paragraph opacity={0.7}>Guild</Paragraph>
                                        <XStack alignItems="center" gap="$2">
                                            {index < 3 && (
                                                <Paragraph>
                                                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                                </Paragraph>
                                            )}
                                            <Paragraph fontWeight="bold">{group.name}</Paragraph>
                                        </XStack>
                                    </XStack>
                                    <XStack justifyContent="space-between" alignItems="center">
                                        <Paragraph opacity={0.7}>Organizer</Paragraph>
                                        <Paragraph>{group.organizer.name ?? "Unknown"}</Paragraph>
                                    </XStack>
                                    <XStack justifyContent="space-between" alignItems="center">
                                        <Paragraph opacity={0.7}>Companions</Paragraph>
                                        <Badge backgroundColor="$green10" color="$background">
                                            {group.members.length} members
                                        </Badge>
                                    </XStack>
                                    <XStack justifyContent="space-between" alignItems="center">
                                        <Paragraph opacity={0.7}>Coins</Paragraph>
                                        <Paragraph fontWeight="bold">{group.coins}</Paragraph>
                                    </XStack>
                                    <YStack gap="$1">
                                        <Paragraph opacity={0.7}>Recent Transactions</Paragraph>
                                        <YStack gap="$1">
                                            {group.coinTransactions.slice(0, 3).map((transaction) => (
                                                <Paragraph key={transaction.id} opacity={0.7}>
                                                    {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                                                    {" "}from {transaction.admin.name ?? "Unknown"}
                                                </Paragraph>
                                            ))}
                                            {group.coinTransactions.length === 0 && (
                                                <Paragraph opacity={0.5}>
                                                    No Transactions
                                                </Paragraph>
                                            )}
                                        </YStack>
                                    </YStack>
                                </YStack>
                            </Card>
                        ))}
                </YStack>
            </YStack>
        </Suspense>
    );
};

export default CoinOperationCardList;
