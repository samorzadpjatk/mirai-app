"use client";

import { Button, Card, Flex, Text, Badge, Heading, DataList } from "@radix-ui/themes";
import { useEffect } from "react";
import { useNotifications } from "~/hooks/useNotifications";

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

  useEffect(() => {
    if (isSubscribedElsewhere || !isSubscribed) { void subscribe(); }
  }, [isSubscribed, isSubscribedElsewhere, subscribe])

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
                        size={"1"}
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
                  onClick={subscribe}
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
                onClick={testNotification}
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
