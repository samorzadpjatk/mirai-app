import { Smartphone } from "@tamagui/lucide-icons";
import { Card, XStack, Paragraph, Anchor } from "tamagui";
import { Linking } from "react-native";

const StaffNumber = () => {
    const handlePress = () => {
        void Linking.openURL("tel:+48734095706");
    };

    return (
        <Card size="$2" bordered>
            <XStack alignItems="center" width="100%" justifyContent="flex-start" gap="$2">
                <Smartphone size={16} />
                <Paragraph>
                    Staff number: <Anchor textDecorationLine="underline" onPress={handlePress}>+48 734 095 706</Anchor>
                </Paragraph>
            </XStack>
        </Card>
    );
}

export default StaffNumber;