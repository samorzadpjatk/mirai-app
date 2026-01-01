import { Card, H3, Paragraph, YStack, XStack } from "tamagui";
import { Suspense } from "react";
import { formatDate } from "~/utils/format";
import CoinQuickStatsCardSkeleton from "~/components/skelethons/CoinQuickStatsCardSkelethon";

interface CoinQuickStats {
    totalCoins: number;
    totalGroups: number;
    averageCoinsPerGroup: number;
    richestGroupName: string;
    time: Date;
}

interface CoinQuickStatsCardProps {
    coinQuickStats?: CoinQuickStats | null;
    isLoading?: boolean;
}

const CoinQuickStatsCard = ({ coinQuickStats, isLoading }: CoinQuickStatsCardProps) => {
    if (isLoading) {
        return <CoinQuickStatsCardSkeleton />;
    }
    
    if (!coinQuickStats) return null;
    
    return (
        <Suspense fallback={<CoinQuickStatsCardSkeleton />}>
            <Card bordered padding="$4">
                <H3 marginBottom="$4">Stats</H3>
                <YStack gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                        <Paragraph opacity={0.7}>Total Treasure</Paragraph>
                        <Paragraph fontWeight="bold">
                            💰 {coinQuickStats.totalCoins}
                        </Paragraph>
                    </XStack>
                    <XStack justifyContent="space-between" alignItems="center">
                        <Paragraph opacity={0.7}>Number of Guilds</Paragraph>
                        <Paragraph fontWeight="bold">
                            🏛️ {coinQuickStats.totalGroups}
                        </Paragraph>
                    </XStack>
                    <XStack justifyContent="space-between" alignItems="center">
                        <Paragraph opacity={0.7}>Average Treasure per Guild</Paragraph>
                        <Paragraph fontWeight="bold">
                            📊 {coinQuickStats.averageCoinsPerGroup}
                        </Paragraph>
                    </XStack>
                    <XStack justifyContent="space-between" alignItems="center">
                        <Paragraph opacity={0.7}>The Wealthiest Guild</Paragraph>
                        <Paragraph fontWeight="bold">
                            🏆 {coinQuickStats.richestGroupName}
                        </Paragraph>
                    </XStack>
                    <Paragraph>Last update: {formatDate(coinQuickStats.time)}</Paragraph>
                </YStack>
            </Card>
        </Suspense>
    );
}

export default CoinQuickStatsCard;
