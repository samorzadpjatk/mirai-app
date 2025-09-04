"use client";

import { useState } from "react";
import { Button, Card, Flex, Text, Badge, Dialog, Box, Heading } from "@radix-ui/themes";
import { useNotifications } from "~/hooks/useNotifications";
import { api } from "~/trpc/react";

interface NotificationSettingsProps {
  showTestFeatures?: boolean;
  userId?: string;
}

export default function NotificationSettings({ showTestFeatures = false, userId }: NotificationSettingsProps) {
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

  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testTitle, setTestTitle] = useState("Test Notification");
  const [testBody, setTestBody] = useState("This is a test push notification!");

  const sendTestMutation = api.notifications.sendToUser.useMutation();

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

  const handleTestPushNotification = async () => {
    if (!isSubscribed || !userId) return;
    
    try {
      await sendTestMutation.mutateAsync({
        userId: userId,
        title: testTitle,
        body: testBody,
        url: "/",
      });
      setTestDialogOpen(false);
    } catch (error) {
      console.error("Error sending test push notification:", error);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <Flex direction="column" gap="3">
          <Heading size="3">Push Notifications</Heading>
          <Text color="red">
            Push notifications are not supported in this browser.
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Flex direction="column" gap="4">
          <Heading size="3">Push Notifications</Heading>
          
          <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
              <Text size="2">Permission Status:</Text>
              {getPermissionBadge()}
            </Flex>
            
            <Flex justify="between" align="center">
              <Text size="2">Subscription Status:</Text>
              <Badge color={isSubscribed ? "green" : isSubscribedElsewhere ? "yellow" : "gray"}>
                {isSubscribed ? "Subscribed" : isSubscribedElsewhere ? "Subscribed Elsewhere" : "Not Subscribed"}
              </Badge>
            </Flex>
          </Flex>

          <Flex gap="2" wrap="wrap">
            {permission !== "granted" && (
              <Button 
                onClick={requestPermission}
                disabled={isLoading}
                variant="solid"
              >
                Request Permission
              </Button>
            )}

            {permission === "granted" && !isSubscribed && (
              <Button
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
                onClick={unsubscribe}
                disabled={isLoading}
                variant="outline"
                color="red"
              >
                {isLoading ? "Unsubscribing..." : "Disable Notifications"}
              </Button>
            )}

            {permission === "granted" && (
              <Button
                onClick={handleTestNotification}
                variant="outline"
                disabled={isLoading}
              >
                Test Local Notification
              </Button>
            )}

            {showTestFeatures && isSubscribed && userId && (
              <Button
                onClick={() => setTestDialogOpen(true)}
                variant="outline"
                color="blue"
                disabled={sendTestMutation.isPending}
              >
                Test Push Notification
              </Button>
            )}
          </Flex>

          <Text size="1" color="gray">
            Enable push notifications to receive updates about your group activities, 
            coin transactions, and important announcements.
          </Text>
        </Flex>
      </Card>

      {/* Test Push Notification Dialog */}
      <Dialog.Root open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Test Push Notification</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Send a test push notification to verify the system is working.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Title
              </Text>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--gray-7)",
                  borderRadius: "4px",
                }}
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Message
              </Text>
              <textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--gray-7)",
                  borderRadius: "4px",
                  resize: "vertical",
                }}
              />
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleTestPushNotification}
              disabled={sendTestMutation.isPending}
            >
              {sendTestMutation.isPending ? "Sending..." : "Send Test"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
