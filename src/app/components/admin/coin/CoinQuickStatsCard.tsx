"use client"

import { Card, Heading, Text, DataList } from "@radix-ui/themes";
import type { GroupWithAllFields } from "~/types/schema";

const CoinQuickStatsCard = ({groups}: {groups: GroupWithAllFields[]}) => {
    return (<Card>
        <Heading size={{ "initial": "1" }} mb="4">Statystyki</Heading>
        <DataList.Root>
            <DataList.Item>
                <DataList.Label size={{ "initial": "1" }} style={{ opacity: 0.7 }}>Łączna liczba monet</DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1" }} weight="bold">
                        💰 {groups?.reduce((sum, group) => sum + group.coins, 0) || 0}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label size={{ "initial": "1" }} style={{ opacity: 0.7 }}>Liczba gildii</DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1" }} weight="bold">
                        🏛️ {groups?.length ?? 0}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label size={{ "initial": "1" }} style={{ opacity: 0.7 }}>Średnia monet na gildię</DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1" }} weight="bold">
                        📊 {groups?.length ? Math.round((groups.reduce((sum, group) => sum + group.coins, 0)) / groups.length) : 0}
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label size={{ "initial": "1" }} style={{ opacity: 0.7 }}>Najbogatsza gildia</DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1" }} weight="bold">
                        🏆 {groups?.sort((a, b) => b.coins - a.coins)[0]?.name || "Brak"}
                    </Text>
                </DataList.Value>
            </DataList.Item>
        </DataList.Root>
    </Card>);
}

export default CoinQuickStatsCard;