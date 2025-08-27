"use client";

import { useState } from "react";
import { Button, Card, Flex, Text, Heading, Select } from "@radix-ui/themes";

export default function ManualTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notificationType, setNotificationType] = useState("ranking");

  const handleManualTrigger = async () => {
    setLoading(true);
    setResult(null);

    try {
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
    } catch (error) {
      console.error("Error triggering manual notification:", error);
      setResult({
        success: false,
        error: "Failed to send notification",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Heading size="4">Ręczne uruchamianie powiadomień</Heading>
        
        <Flex direction="column" gap="3">
          <div>
            <Text as="div" size="2" mb="2" weight="bold">
              Typ powiadomienia:
            </Text>
            <Select.Root
              value={notificationType}
              onValueChange={setNotificationType}
            >
              <Select.Trigger style={{ width: "200px" }} />
              <Select.Content>
                <Select.Item value="ranking">Ranking gildii</Select.Item>
                <Select.Item value="weekly">Podsumowanie tygodniowe</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          <Button
            onClick={handleManualTrigger}
            disabled={loading}
            style={{ width: "fit-content" }}
          >
            {loading ? "Wysyłanie..." : "Wyślij powiadomienie"}
          </Button>
        </Flex>

        {result && (
          <Card variant="surface">
            <Flex direction="column" gap="2">
              <Text weight="bold" color={result.success ? "green" : "red"}>
                {result.success ? "✅ Sukces" : "❌ Błąd"}
              </Text>
              
              {result.success ? (
                <Flex direction="column" gap="1">
                  <Text size="2">Typ: {result.type}</Text>
                  <Text size="2">Wysłano: {result.sent}</Text>
                  <Text size="2">Błędy: {result.failed}</Text>
                  <Text size="2">Łączna liczba użytkowników: {result.totalUsers}</Text>
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
          To narzędzie pozwala na ręczne wysyłanie powiadomień do wszystkich użytkowników.
          Normalne powiadomienia będą wysyłane automatycznie według harmonogramów.
        </Text>
      </Flex>
    </Card>
  );
}
