import { YStack, H3, Input, Card } from "tamagui";
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
                <Input
                    placeholder="Search transactions..."
                    onChangeText={onSearchChange}
                    icon={<Search size={16} />}
                />
                {children}
            </YStack>
        </Suspense>
    );
};

export default TransactionCardListView;
