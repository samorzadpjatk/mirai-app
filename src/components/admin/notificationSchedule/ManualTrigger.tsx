"use client";

import { useState } from "react";
import { Button, Card, Flex, Text, Heading, Select, TextField, TextArea } from "@radix-ui/themes";
import { api } from "~/trpc/react";

export default function ManualTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notificationType, setNotificationType] = useState("ranking");
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const { data: groups } = api.group.getAll.useQuery();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const sendCustomNotificationMutation = api.notifications.sendCustomToAll.useMutation();
  const sendCustomNotificationToGroupMutation = api.notifications.sendToGroup.useMutation();

  const handleManualTrigger = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (notificationType === "custom") {
        // Handle custom notification
        if (!customTitle.trim() || !customBody.trim()) {
          setResult({
            success: false,
            error: "Title and body are required for custom message",
          });
          return;
        }
        if (selectedGroupId != "all") {
          // Send to specific group
          const groupResult = await sendCustomNotificationToGroupMutation.mutateAsync({
            groupId: selectedGroupId,
            title: customTitle.trim(),
            body: customBody.trim(),
            url: "/",
          });
          setResult(groupResult);
        } else {
          // Send to all users
          const customResult = await sendCustomNotificationMutation.mutateAsync({
            title: customTitle.trim(),
            body: customBody.trim(),
            url: "/",
          });
          setResult(customResult);
        }
      } else {
        // Handle scheduled notification types (ranking, weekly)
        const response = await fetch("/api/scheduler", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: notificationType,
          }),
        });

        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Error triggering manual notification:", error);
      setResult({
        success: false,
        error: "Error sending notification",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Heading size="4">Manual Notification Trigger</Heading>
        
        <Flex direction="column" gap="3">
          <div>
            <Text as="div" size="2" mb="2" weight="bold">
              Notification type:
            </Text>
            <Select.Root
              value={notificationType}
              onValueChange={setNotificationType}
            >
              <Select.Trigger style={{ width: "200px" }} />
              <Select.Content>
                <Select.Item value="ranking">Leaderboard of Guilds</Select.Item>
                <Select.Item value="weekly">Weekly summary</Select.Item>
                <Select.Item value="custom">Custom message</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          {notificationType === "custom" && (
            <>
              <div>
                <Text as="div" size="2" mb="2" weight="bold">
                  Title of notification:
                </Text>
                <TextField.Root
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Type title of notification..."
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <Text as="div" size="2" mb="2" weight="bold">
                  Notification body:
                </Text>
                <TextArea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Type body of notification..."
                  rows={4}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <Text as="div" size="2" mb="2" weight="bold">
                  Target group:
                </Text>
                <Select.Root
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <Select.Trigger style={{ width: "100%" }} />
                  <Select.Content>
                    <Select.Item value="all">All users</Select.Item>
                    {groups?.map((group) => (
                      <Select.Item key={group.id} value={group.id}>
                        {group.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>
            </>
          )}

          <Button
            onClick={handleManualTrigger}
            disabled={loading || (notificationType === "custom" && (!customTitle.trim() || !customBody.trim()))}
            style={{ width: "fit-content" }}
          >
            {loading ? "Sending..." : "Summon notification"}
          </Button>
        </Flex>

        {result && (
          <Card variant="surface">
            <Flex direction="column" gap="2">
              <Text weight="bold" color={result.success ? "green" : "red"}>
                {result.success ? "✅ Success" : "❌ Error"}
              </Text>
              
              {result.success ? (
                <Flex direction="column" gap="1">
                  {result.type && <Text size="2">Type: {result.type}</Text>}                  
                  <Text size="2">Sent: {result.sent}</Text>
                  <Text size="2">Errors: {result.failed}</Text>
                  <Text size="2">Total number of users: {result.totalUsers}</Text>
                  <Text size="2" color="gray">
                    Czas: {new Date(result.timestamp).toLocaleString("pl-PL")}
                  </Text>
                </Flex>
              ) : (
                <Text size="2" color="red">
                  {result.error}
                </Text>
              )}
            </Flex>
          </Card>
        )}

        <Text size="2" color="gray">
          With this tool, you may summon notifications to all souls of the realm at will.
          Ordinary messages shall be dispatched automatically by the appointed schedules.
          Use the "Custom Message" option to send a personalized notification to all users. 
        </Text>
      </Flex>
    </Card>
  );
}
