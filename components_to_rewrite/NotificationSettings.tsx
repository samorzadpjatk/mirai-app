import { Button, Card, YStack, Paragraph, Badge, H3, XStack, Separator } from "tamagui";
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
        return <Badge backgroundColor="$green10" color="$background">Granted</Badge>;
      case "denied":
        return <Badge backgroundColor="$red10" color="$background">Denied</Badge>;
      default:
        return <Badge backgroundColor="$gray10" color="$background">Not Requested</Badge>;
    }
  };

  const getStatusColor = () => {
    if (isSubscribed) return "$green10";
    if (isSubscribedElsewhere) return "$yellow10";
    return "$gray10";
  };

  return (
    <Card elevate bordered padding="$4">
      <YStack gap="$2">
        <H3>Push Notifications</H3>
        <YStack gap="$3">
          {!isSupported && (
            <XStack justifyContent="space-between" alignItems="center">
              <Paragraph>Browser Support:</Paragraph>
              <Badge backgroundColor="$red10" color="$background">Not Supported</Badge>
            </XStack>
          )}
          {isSupported && permission !== "granted" && (
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Paragraph>Permission Status:</Paragraph>
                <YStack gap="$2" alignItems="flex-end">
                  {getPermissionBadge()}
                  <Button
                    size="$2"
                    onPress={requestPermission}
                    disabled={isLoading}
                  >
                    Request Permission
                  </Button>
                </YStack>
              </XStack>
            </YStack>
          )}
          {permission === "granted" && (
            <XStack justifyContent="space-between" alignItems="center">
              <Paragraph>Subscription Status:</Paragraph>
              <Badge backgroundColor={getStatusColor()} color="$background">
                {isSubscribed ? "Subscribed" : isSubscribedElsewhere ? "Subscribed Elsewhere" : "Not Subscribed"}
              </Badge>
            </XStack>
          )}
        </YStack>
        {permission === "granted" && (
          <XStack gap="$2" flexWrap="wrap">
            {!isSubscribed && (
              <Button
                size="$2"
                onPress={subscribe}
                disabled={isLoading}
                theme="green"
              >
                {isLoading ? "Subscribing..." : "Enable Notifications"}
              </Button>
            )}

            {isSubscribed && (
              <Button
                size="$2"
                onPress={unsubscribe}
                disabled={isLoading}
                theme="red"
              >
                {isLoading ? "Unsubscribing..." : "Disable Notifications"}
              </Button>
            )}
            <Button
              size="$2"
              onPress={testNotification}
              disabled={isLoading}
            >
              Test Local Notification
            </Button>
          </XStack>
        )}
        {isSupported && (
          <Paragraph size="$2" color="$gray11">
            Enable push notifications to receive updates about your group activities,
            coin transactions, and important announcements.
          </Paragraph>
        )}
      </YStack>
    </Card>
  );
}
