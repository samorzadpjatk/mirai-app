import { useState } from "react";
import { Button, XStack, YStack, Input, Paragraph, Dialog, Adapt, Sheet } from "tamagui";
import { Plus, Trash2 } from "@tamagui/lucide-icons";

interface HouseNumberManagerProps {
  userId: string;
  userName: string;
  currentHouseNumber?: string | null;
  onUpdate?: (userId: string, houseNumber: string) => void;
  onRemove?: (userId: string) => void;
}

export default function HouseNumberManager({ 
  userId, 
  userName, 
  currentHouseNumber,
  onUpdate,
  onRemove 
}: HouseNumberManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [houseNumber, setHouseNumber] = useState(currentHouseNumber ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!houseNumber.trim()) {
      setError("House number cannot be empty");
      return;
    }
    
    setError("");
    if (onUpdate) {
      onUpdate(userId, houseNumber.trim());
    }
    setIsDialogOpen(false);
  };

  const handleRemove = () => {
    setError("");
    if (onRemove) {
      onRemove(userId);
    }
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Dialog.Trigger asChild>
        <Button
          size="$3"
          icon={currentHouseNumber ? <Trash2 size={16} /> : <Plus size={16} />}
        >
          {currentHouseNumber ? "Remove House #" : "Add House #"}
        </Button>
      </Dialog.Trigger>

      <Adapt when={true} platform="touch">
        <Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom>
          <Sheet.Frame p="$4" gap="$4">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay key="overlay" animation="quick" opacity={0.5} />
        <Dialog.Content bordered elevate key="content" gap="$4">
          <Dialog.Title>Manage House Number</Dialog.Title>
          <Dialog.Description>
            Manage house number for {userName}
          </Dialog.Description>

          <YStack gap="$4">
            <YStack gap="$2">
              <Paragraph>House Number</Paragraph>
              <Input
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder="Enter house number"
              />
            </YStack>

            {error && (
              <Paragraph color="$red10">{error}</Paragraph>
            )}
          </YStack>

          <XStack gap="$3" justify="flex-end">
            {currentHouseNumber && (
              <Button  onPress={handleRemove}>
                Remove
              </Button>
            )}
            <Dialog.Close asChild>
              <Button >Cancel</Button>
            </Dialog.Close>
            <Button onPress={handleSave}>
              Save
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
