"use client"

import { GearIcon } from "@radix-ui/react-icons";
import { Popover, Button, Flex, Select, Text, Skeleton } from "@radix-ui/themes";
import { useState } from "react";

const TransactionListFilterPopover = ({ groups, selectedGroupId, setSelectedGroupId, limit, setLimit, loading }: {
    groups: Array<{ id: string, name: string }> | undefined,
    selectedGroupId: string,
    setSelectedGroupId: (id: string) => void,
    limit: number,
    setLimit: (limit: number) => void,
    loading: boolean
}) => {
    const [open, setOpen] = useState(false);
    return (<Skeleton loading={loading}><Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger>
            <Button size={{ "initial": "1", "xs": "2", "sm": "3" }} onClick={() => setOpen(!open)}>
                <GearIcon />
            </Button>
        </Popover.Trigger>
        <Popover.Content>
            <Flex direction="column" gap="2">
                <>
                    <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        Gildia
                    </Text>
                    <Select.Root size={{ "initial": "1", "xs": "2", "sm": "3" }} value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <Select.Trigger placeholder="Wszystkie gildie" />
                        <Select.Content>
                            <Select.Item value="all">Wszystkie gildie</Select.Item>
                            {groups?.map((group) => (
                                <Select.Item key={group.id} value={group.id}>
                                    {group.name}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>
                </>

                <>
                    <Text as="label" size={{ "initial": "1", "xs": "2", "sm": "3" }} weight="bold">
                        Limit wyników
                    </Text>
                    <Select.Root size={{ "initial": "1", "xs": "2", "sm": "3" }} value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                        <Select.Trigger />
                        <Select.Content>
                            <Select.Item value="10">10 ostatnich</Select.Item>
                            <Select.Item value="25">25 ostatnich</Select.Item>
                            <Select.Item value="50">50 ostatnich</Select.Item>
                            <Select.Item value="100">100 ostatnich</Select.Item>
                        </Select.Content>
                    </Select.Root>
                </></Flex>
        </Popover.Content>
    </Popover.Root></Skeleton>)
}

export default TransactionListFilterPopover;