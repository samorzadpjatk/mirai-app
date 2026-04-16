import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "urql";
import { YStack, XStack, Text, Card } from "@mirai-app/ui";
import { useGetCurrentUserQuery } from "@mirai-app/frameworks";

export function AccountInfoSection() {
  const [result] = useQuery({
    query: useGetCurrentUserQuery.document,
  });

  const { data } = result;

  const currentUser = data?.me;
  const email = currentUser?.email;

  return (
    <YStack marginBottom="$5">
      <Text
        variant="overline"
        color="muted"
        marginBottom="$3"
        paddingHorizontal="$1"
      >
        Account Information
      </Text>

      <Card backgroundColor="$surface" borderRadius="$5" padding="$4" bordered>
        <XStack alignItems="center" gap="$3">
          <YStack
            width={40}
            height={40}
            borderRadius="$3"
            backgroundColor="rgba(0, 206, 209, 0.1)"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name="mail" size={20} color="$primary" />
          </YStack>
          <YStack flex={1}>
            <Text variant="caption" color="muted" marginBottom="$0.5">
              Email
            </Text>
            <Text variant="body" fontWeight="$medium" color="$color">
              {email}
            </Text>
          </YStack>
        </XStack>
      </Card>
    </YStack>
  );
}
