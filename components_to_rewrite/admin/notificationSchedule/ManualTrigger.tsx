"use client";

import { useState } from "react";
import { Button, Card, Flex, Text, Heading, Select, TextField, TextArea } from "@radix-ui/themes";

interface ManualTriggerResult {
  success: boolean,
  sent?: number,
  failed?: number,
  total?: number,
  timestamp: number,
  error?: string,
  type?: "ranking" | "custom",
}

export default function ManualTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManualTriggerResult | null>(null);
  const [notificationType, setNotificationType] = useState<string>("ranking");
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const { data: groups } = api.group.getAll.useQuery();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const sendToAll = api.notifications.sendToAll.useMutation();
  const sendToGroup = api.notifications.sendToGroup.useMutation();
  const sendRanking = api.notifications.sendRankingUpdateToGroups.useMutation();

  const handleManualTrigger = async () => {
    setLoading(true);
    setResult(null);
    let res;
    try {
      switch (notificationType) {
        case "custom":
          if (!customTitle.trim() || !customBody.trim()) {
            setResult({ success: false, error: "Title and body are required for custom notifications.", timestamp: Date.now() });
            setLoading(false);
            return;
          }
          if (selectedGroupId === "all") {
            res = await sendToAll.mutateAsync({
              title: customTitle,
              body: customBody,
              url: "/",
            });
          } else {
            res = await sendToGroup.mutateAsync({
              groupId: selectedGroupId,
              title: customTitle,
              body: customBody,
              url: "/",
            });
          }

          setResult({
            type: "custom",
            timestamp: Date.now(),
            ...res
          });
          break;
        case "ranking":
          res = await sendRanking.mutateAsync();

          setResult({
            type: "ranking",
            timestamp: Date.now(),
            ...res
          });
          break;
        default:
          setResult({ success: false, error: "Invalid notification type", timestamp: Date.now() });
          setLoading(false);
          break;
      }
    } catch (error) {
      console.error("Error triggering manual notification:", error);
      setResult({
        success: false,
        error: "Error sending notification",
        timestamp: Date.now(),
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
                <Select.Item value="ranking">Ranking update</Select.Item>
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
                  <Text size="2">Total number of users: {result.total}</Text>
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
          Use the &quot;Custom Message&quot; option to send a personalized notification to all users.
        </Text>
      </Flex>
    </Card>
  );
}
