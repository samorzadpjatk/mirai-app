import { DataList, Heading, Skeleton, Text } from "@radix-ui/themes";

const CoinQuickStatsCardSkeleton = () => {
    return (
        <><Heading size={{ "initial": "1", "xs": "2", "sm": "3" }} mb="4">Statystyki</Heading><DataList.Root size={{ initial: "1" }}>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Łączna liczba monet</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        <Skeleton loading={true} />
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Liczba gildii</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        <Skeleton loading={true} />
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Średnia monet na gildię</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        <Skeleton loading={true} />
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label><Text size={{ "initial": "1", "xs": "2", "sm": "3" }} style={{ opacity: 0.7 }}>Najbogatsza gildia</Text></DataList.Label>
                <DataList.Value>
                    <Text size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        <Skeleton loading={true} />
                    </Text>
                </DataList.Value>
            </DataList.Item>
            <Text size={{ "initial": "1", "xs": "2", "sm": "3" }}><Skeleton loading={true} /></Text>
        </DataList.Root></>
    );
}

export default CoinQuickStatsCardSkeleton;