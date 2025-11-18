import {
  Card,
  Flex,
  Badge,
  Text,
  Heading,
  DataList,
  Separator,
  Avatar,
} from "@radix-ui/themes";
import { getSession } from "~/server/auth";
import { api } from "~/trpc/server";

const MyGroupPage = async () => {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  const group = await api.group.getMy();
  if (!group) {
    return (
      <Card size={{ initial: "4" }} style={{ width: "100%" }}>
        <Text>You are not a member of any group.</Text>
      </Card>
    );
  }
  return (
    <Card
      key={group.id}
      size={{ initial: "1", xs: "2", sm: "3" }}
      style={{ width: "100%" }}
    >
      <Flex direction="column" gap={{ initial: "2" }}>
        <Heading>{group.name}</Heading>
        <DataList.Root>
          <DataList.Item>
            <DataList.Label>Lord of the Guild</DataList.Label>
            <DataList.Value>{group.organizer.name}</DataList.Value>
          </DataList.Item>
          <DataList.Item align={"center"}>
            <DataList.Label>Treasury Status</DataList.Label>
            <DataList.Value>
              <Badge size={"3"} variant="soft" color="gold">
                💰 {group.coins} coins
              </Badge>
            </DataList.Value>
          </DataList.Item>
          {group.members.length > 0 && (
            <DataList.Item>
              <DataList.Label>Companions</DataList.Label>
              <DataList.Value>
                <Flex direction="column" gap="2">
                  {group.members.map((member) => (
                    <Text key={member.id}>{member.name}</Text>
                  ))}
                </Flex>
              </DataList.Value>
            </DataList.Item>
          )}
        </DataList.Root>
        {group.coinTransactions.length > 0 && (
          <Flex direction="column" gap="2">
            <Heading size="4">Treasury Transactions</Heading>
            <Flex direction="column" gap="3">
              {group.coinTransactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  size={{ initial: "1", xs: "2", sm: "3" }}
                >
                  <Flex direction="column" gap="2">
                    <Flex justify="start" align="center" gap={"2"}>
                      <Text size={{ initial: "1", xs: "2", sm: "3" }}>
                        {transaction.createdAt.toLocaleString()}
                      </Text>
                      <Separator orientation="vertical" />
                      <Text size={{ initial: "1", xs: "2", sm: "3" }}>
                        {transaction.admin.name}
                      </Text>
                      <Separator orientation="vertical" />
                      <Text
                        size={{ initial: "1", xs: "2", sm: "3" }}
                        weight="bold"
                      >
                        {transaction.amount > 0 && "+"}
                        {transaction.amount}
                      </Text>
                    </Flex>
                    {transaction.reason && (
                      <Text
                        size={{ initial: "1", xs: "2", sm: "3" }}
                        color="gray"
                      >
                        ({transaction.reason})
                      </Text>
                    )}
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

export default MyGroupPage;
