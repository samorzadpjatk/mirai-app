import { useState } from "react";
import { Button, XStack, YStack, Input, Paragraph, Dialog, Adapt, Sheet } from "tamagui";
import { Plus, Trash2 } from "@tamagui/lucide-icons";

interface WristNumberManagerProps {
  userId: string;
  userName: string;
  currentWristNumber?: string | null;
  onUpdate?: (userId: string, wristNumber: string) => void;
  onRemove?: (userId: string) => void;
}

export default function WristNumberManager({ 
  userId, 
  userName, 
  currentWristNumber,
  onUpdate,
  onRemove 
}: WristNumberManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [wristNumber, setWristNumber] = useState(currentWristNumber ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!wristNumber.trim()) {
      setError("Wrist number cannot be empty");
      return;
    }
    
    setError("");
    if (onUpdate) {
      onUpdate(userId, wristNumber.trim());
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
          icon={currentWristNumber ? <Trash2 size={16} /> : <Plus size={16} />}
        >
          {currentWristNumber ? "Remove Wrist #" : "Add Wrist #"}
        </Button>
      </Dialog.Trigger>

      <Adapt when="sm" platform="touch">
        <Sheet animation="medium" zIndex={200000} modal dismissOnSnapToBottom>
          <Sheet.Frame padding="$4" gap="$4">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay key="overlay" animation="quick" opacity={0.5} />
        <Dialog.Content bordered elevate key="content" gap="$4">
          <Dialog.Title>Manage Wrist Number</Dialog.Title>
          <Dialog.Description>
            Manage wrist number for {userName}
          </Dialog.Description>

          <YStack gap="$4">
            <YStack gap="$2">
              <Paragraph>Wrist Number</Paragraph>
              <Input
                value={wristNumber}
                onChangeText={setWristNumber}
                placeholder="Enter wrist number"
              />
            </YStack>

            {error && (
              <Paragraph color="$red10">{error}</Paragraph>
            )}
          </YStack>

          <XStack gap="$3" justifyContent="flex-end">
            {currentWristNumber && (
              <Button theme="red" onPress={handleRemove}>
                Remove
              </Button>
            )}
            <Dialog.Close asChild>
              <Button theme="alt1">Cancel</Button>
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
