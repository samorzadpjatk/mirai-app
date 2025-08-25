import { Card, Heading, Text, DataList } from "@radix-ui/themes";
import { Suspense } from "react";
import { formatDate } from "~/utils/format";
import { api } from "~/trpc/server";

const CoinQuickStatsCard = async () => {
    const coinQuickStats = await api.coinTransaction.getQuickStats();
    return (<Suspense fallback={<div>Ładowanie...</div>}><Card>
        <Heading size={{ "initial": "1", "xs": "2", "sm": "3" }} mb="4">Statystyki</Heading>
        <DataList.Root size={{ initial: "1" }}>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Łączna liczba monet</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        💰 {coinQuickStats?.totalCoins}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Liczba gildii</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        🏛️ {coinQuickStats?.totalGroups}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Średnia monet na gildię</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        📊 {coinQuickStats?.averageCoinsPerGroup}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Najbogatsza gildia</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        🏆 {coinQuickStats?.richestGroupName}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}>Ostatnia aktualizacja: {formatDate(new Date())}</Text>
        </DataList.Root>
    </Card></Suspense>);
}

export default CoinQuickStatsCard;