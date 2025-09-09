import { Card, Heading, Text, DataList } from "@radix-ui/themes";
import { Suspense } from "react";
import { formatDate } from "~/utils/format";
import { api } from "~/trpc/server";
import CoinQuickStatsCardSkeleton from "~/components/skelethons/CoinQuickStatsCardSkelethon";

const CoinQuickStatsCard = async () => {
    const coinQuickStats = await api.coinTransaction.getQuickStats();
    if (!coinQuickStats) return null;
    return (<Suspense fallback={<CoinQuickStatsCardSkeleton />}><Card>
        <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }} mb="4">Stats</Heading>
        <DataList.Root size={{ initial: "1" }}>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Total Treasure</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        💰 {coinQuickStats.totalCoins}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Number of Guilds</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        🏛️ {coinQuickStats.totalGroups}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Average Treasure per Guild</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        📊 {coinQuickStats.averageCoinsPerGroup}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>The Wealthiest Guild</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        🏆 {coinQuickStats.richestGroupName}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>Last update: {formatDate(coinQuickStats.time)}</Text>
        </DataList.Root>
    </Card></Suspense>);
}

export default CoinQuickStatsCard;