"use client";

import { useState } from "react";
import { Button, Card, Flex, Text, Heading, Select, TextField, TextArea } from "@radix-ui/themes";
import { api } from "~/trpc/react";
import { useOfflineNotificationMutation } from "~/hooks/useUniversalOfflineMutation";

export default function ManualTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notificationType, setNotificationType] = useState("ranking");
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  
  // Enhanced notification mutation with offline handling
  const offlineCustomNotification = useOfflineNotificationMutation();
  const { mutation: sendCustomNotificationMutation, offlineStatus } = offlineCustomNotification(
    () => api.notifications.sendCustomToAll.useMutation(),
    'sendCustomToAll'
  );

  const handleManualTrigger = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (notificationType === "custom") {
        // Handle custom notification
        if (!customTitle.trim() || !customBody.trim()) {
          setResult({
            success: false,
            error: "Tytuł i treść są wymagane dla własnej wiadomości",
          });
          return;
        }

        const customResult = await sendCustomNotificationMutation.mutateAsync({
          title: customTitle.trim(),
          body: customBody.trim(),
          url: "/",
        });

        setResult(customResult);
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
        error: "Wystąpił błąd podczas wysyłania powiadomienia",
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
                <Select.Item value="custom">Własna wiadomość</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          {notificationType === "custom" && (
            <>
              <div>
                <Text as="div" size="2" mb="2" weight="bold">
                  Tytuł powiadomienia:
                </Text>
                <TextField.Root
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Wpisz tytuł powiadomienia..."
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <Text as="div" size="2" mb="2" weight="bold">
                  Treść powiadomienia:
                </Text>
                <TextArea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Wpisz treść powiadomienia..."
                  rows={4}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}

          {/* Offline Status Indicator */}
          {offlineStatus && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              backgroundColor: offlineStatus.includes('saved for later') ? 'var(--orange-2)' : 'var(--red-2)',
              border: offlineStatus.includes('saved for later') ? '1px solid var(--orange-6)' : '1px solid var(--red-6)'
            }}>
              <Text 
                size="2" 
                color={offlineStatus.includes('saved for later') ? 'orange' : 'red'}
              >
                {offlineStatus}
              </Text>
              {offlineStatus.includes('saved for later') && (
                <Text size="1" color="gray" style={{ display: 'block', marginTop: '0.5rem' }}>
                  Notification will be sent when connection is restored.
                </Text>
              )}
            </div>
          )}

          <Button
            onClick={handleManualTrigger}
            disabled={loading || (notificationType === "custom" && (!customTitle.trim() || !customBody.trim()))}
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
                  {result.type && <Text size="2">Typ: {result.type}</Text>}
                  <Text size="2">Wysłano: {result.sent}</Text>
                  <Text size="2">Błędy: {result.failed}</Text>
                  <Text size="2">Łączna liczba użytkowników: {result.totalUsers}</Text>
                  {result.message && <Text size="2" color="green">{result.message}</Text>}
                  {result.timestamp && (
                    <Text size="2" color="gray">
                      Czas: {new Date(result.timestamp).toLocaleString("pl-PL")}
                    </Text>
                  )}
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
          Użyj opcji "Własna wiadomość" aby wysłać spersonalizowane powiadomienie do wszystkich użytkowników.
        </Text>
      </Flex>
    </Card>
  );
}
