"use client";

import { Button, Card, Flex, Text, Badge, Heading, DataList } from "@radix-ui/themes";
import { useNotifications } from "~/hooks/useNotifications";

interface NotificationSettingsProps {
  userId?: string;
}

export default function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isSubscribedElsewhere,
    isLoading,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
  } = useNotifications();

  const getPermissionBadge = () => {
    switch (permission) {
      case "granted":
        return <Badge color="green">Granted</Badge>;
      case "denied":
        return <Badge color="red">Denied</Badge>;
      default:
        return <Badge color="gray">Not Requested</Badge>;
    }
  };

  const handleSubscribe = async () => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await subscribe();
  };

  const handleTestNotification = () => {
    if (permission === "granted") {
      testNotification();
    }
  };

  return (
    <>
      <Card>
        <Flex direction="column" gap="2">
          <Heading size="3">Push Notifications</Heading>
          <DataList.Root size={"1"}>
            {!isSupported && (
              <DataList.Item>
                <DataList.Label>Browser Support:</DataList.Label>
                <DataList.Value>
                  <Badge color="red">Not Supported</Badge>
                </DataList.Value>
              </DataList.Item>
            )}
            {isSupported && permission !== "granted" && (
              <DataList.Item>
                <DataList.Label>Permission Status:</DataList.Label>
                <DataList.Value>
                  <Flex gap={"1"} align={"baseline"} direction={"column"}>
                    {(<>
                      {getPermissionBadge()}
                      <Button
                        onClick={requestPermission}
                        disabled={isLoading}
                        variant="solid"
                      >
                        Request Permission
                      </Button>
                    </>
                    )}
                  </Flex>
                </DataList.Value>
              </DataList.Item>
            )}
            {permission === "granted" && (<>
              <DataList.Item>
                <DataList.Label>Subscription Status:</DataList.Label>
                <DataList.Value>
                  <Badge color={isSubscribed ? "green" : isSubscribedElsewhere ? "yellow" : "gray"}>
                    {isSubscribed ? "Subscribed" : isSubscribedElsewhere ? "Subscribed Elsewhere" : "Not Subscribed"}
                  </Badge>
                </DataList.Value>
              </DataList.Item>
            </>
            )}
          </DataList.Root>
          {permission === "granted" && (
            <Flex gap={"1"} align={"baseline"} direction={"row"}>
              {!isSubscribed && (
                <Button
                  size={"1"}
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  variant="solid"
                  color="green"
                >
                  {isLoading ? "Subscribing..." : "Enable Notifications"}
                </Button>
              )}

              {isSubscribed && (
                <Button
                  size={"1"}
                  onClick={unsubscribe}
                  disabled={isLoading}
                  variant="outline"
                  color="red"
                >
                  {isLoading ? "Unsubscribing..." : "Disable Notifications"}
                </Button>
              )}
              <Button
                size={"1"}
                onClick={handleTestNotification}
                variant="outline"
                disabled={isLoading}
              >
                Test Local Notification
              </Button>
            </Flex>
          )}
          {isSupported && (
            <Text size="1" color="gray">
              Enable push notifications to receive updates about your group activities,
              coin transactions, and important announcements.
            </Text>
          )}
        </Flex>
      </Card >
    </>
  );
}
