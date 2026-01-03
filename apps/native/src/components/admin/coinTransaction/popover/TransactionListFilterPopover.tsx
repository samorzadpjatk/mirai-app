import { useState } from "react";
import { Button, Popover, YStack, Select, Adapt, Sheet } from "tamagui";
import { Settings } from "@tamagui/lucide-icons";

interface TransactionListFilterPopoverProps {
    onFilterChange?: (filter: string) => void;
}

const TransactionListFilterPopover = ({ onFilterChange }: TransactionListFilterPopoverProps) => {
    const [filter, setFilter] = useState("all");

    const handleFilterChange = (value: string) => {
        setFilter(value);
        if (onFilterChange) {
            onFilterChange(value);
        }
    };

    return (
        <Popover size="$5" allowFlip>
            <Popover.Trigger asChild>
                <Button icon={<Settings size={16} />} size="$3">
                    Filter
                </Button>
            </Popover.Trigger>

            <Popover.Content
                borderWidth={1}
                borderColor="$borderColor"
                enterStyle={{ y: -10, opacity: 0 }}
                exitStyle={{ y: -10, opacity: 0 }}
                elevate
                animation={[
                    'quick',
                    {
                        opacity: {
                            overshootClamping: true,
                        },
                    },
                ]}
            >
                <YStack gap="$3" p="$3">
                    <Select value={filter} onValueChange={handleFilterChange}>
                        <Select.Trigger width="$15" iconAfter={null}>
                            <Select.Value />
                        </Select.Trigger>

                        <Adapt when={true} platform="touch">
                            <Sheet modal dismissOnSnapToBottom>
                                <Sheet.Frame>
                                    <Sheet.ScrollView>
                                        <Adapt.Contents />
                                    </Sheet.ScrollView>
                                </Sheet.Frame>
                                <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                            </Sheet>
                        </Adapt>

                        <Select.Content zIndex={200000}>
                            <Select.ScrollUpButton />
                            <Select.Viewport>
                                <Select.Item value="all" index={0}>
                                    <Select.ItemText>All Transactions</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="positive" index={1}>
                                    <Select.ItemText>Positive Only</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="negative" index={2}>
                                    <Select.ItemText>Negative Only</Select.ItemText>
                                </Select.Item>
                            </Select.Viewport>
                            <Select.ScrollDownButton />
                        </Select.Content>
                    </Select>
                </YStack>
            </Popover.Content>
        </Popover>
    );
};

export default TransactionListFilterPopover;
