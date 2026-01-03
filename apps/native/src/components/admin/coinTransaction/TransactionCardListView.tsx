import { YStack, H3, Input } from "tamagui";
import { Search } from "@tamagui/lucide-icons";
import { Suspense } from "react";
import TransactionCardListSkelethon from "~/components/skelethons/TransactionCardListSkelethon";

interface TransactionCardListViewProps {
    children: React.ReactNode;
    onSearchChange?: (text: string) => void;
}

const TransactionCardListView = ({ children, onSearchChange }: TransactionCardListViewProps) => {
    return (
        <Suspense fallback={<TransactionCardListSkelethon />}>
            <YStack gap="$4">
                <H3>Transaction History</H3>
                <YStack>
                    <Input
                        placeholder="Search transactions..."
                        onChangeText={(e) => onSearchChange?.(e.nativeEvent.text)}
                    />
                    <YStack position="absolute" r="$3" t="$3" pointerEvents="none">
                        <Search size={16} />
                    </YStack>
                </YStack>
                {children}
            </YStack>
        </Suspense>
    );
};

export default TransactionCardListView;
