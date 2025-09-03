"use client";

import { useState } from "react";
import { Button, Flex, TextField, Text, Dialog } from "@radix-ui/themes";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useOfflineUserMutation } from "~/hooks/useUniversalOfflineMutation";

interface WristNumberManagerProps {
  userId: string;
  userName: string;
  currentWristNumber?: string | null;
}

export default function WristNumberManager({ 
  userId, 
  userName, 
  currentWristNumber 
}: WristNumberManagerProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [wristNumber, setWristNumber] = useState(currentWristNumber ?? "");
  const [error, setError] = useState("");

  // Enhanced mutations with offline handling
  const offlineUserUpdate = useOfflineUserMutation('updateWristNumber');
  const offlineUserRemove = useOfflineUserMutation('removeWristNumber');
  
  const { mutation: updateWristNumberMutation, offlineStatus: updateOfflineStatus } = offlineUserUpdate(() => 
    api.user.updateWristNumber.useMutation({
      onSuccess: () => {
        setIsDialogOpen(false);
        setError("");
        router.refresh();
      },
      onError: (error) => {
        setError(error.message);
      }
    })
  );

  const { mutation: removeWristNumberMutation, offlineStatus: removeOfflineStatus } = offlineUserRemove(() => 
    api.user.removeWristNumber.useMutation({
      onSuccess: () => {
        setIsDialogOpen(false);
        setError("");
        router.refresh();
      },
      onError: (error) => {
        setError(error.message);
      }
    })
  );

  // Combined offline status
  const offlineStatus = updateOfflineStatus || removeOfflineStatus;

  const handleSave = () => {
    if (!wristNumber.trim()) {
      setError("Numer opaski nie może być pusty");
      return;
    }
    
    setError("");
    updateWristNumberMutation.mutate({
      userId,
      wristNumber: wristNumber.trim(),
    });
  };

  const handleRemove = () => {
    setError("");
    removeWristNumberMutation.mutate({ userId });
  };

  const handleOpenDialog = () => {
    setWristNumber(currentWristNumber ?? "");
    setError("");
    setIsDialogOpen(true);
  };

  return (
    <>
      <Button
        size="1"
        variant="soft"
        color={currentWristNumber ? "green" : "gray"}
        onClick={handleOpenDialog}
      >
        <PlusIcon />
        {currentWristNumber ? "Zmień opaskę" : "Przypisz opaskę"}
      </Button>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>
            {currentWristNumber ? "Zmień numer opaski" : "Przypisz numer opaski"}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {currentWristNumber 
              ? `Zmień numer opaski dla użytkownika: ${userName}`
              : `Przypisz numer opaski dla użytkownika: ${userName}`
            }
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <div>
              <Text as="div" size="2" mb="1" weight="bold">
                Numer opaski
              </Text>
              <TextField.Root
                value={wristNumber}
                onChange={(e) => setWristNumber(e.target.value)}
                placeholder="Wpisz numer opaski..."
                style={{ width: "100%" }}
              />
              {error && (
                <Text size="1" color="red" mt="1">
                  {error}
                </Text>
              )}
            </div>
          </Flex>

          <Flex gap="3" mt="4" justify="between">
            <div>
              {currentWristNumber && (
                <Button
                  variant="soft"
                  color="red"
                  onClick={handleRemove}
                  disabled={removeWristNumberMutation.isPending}
                >
                  <TrashIcon />
                  {removeWristNumberMutation.isPending ? "Usuwanie..." : "Usuń opaskę"}
                </Button>
              )}
            </div>
            
            <Flex gap="3">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Anuluj
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleSave}
                disabled={updateWristNumberMutation.isPending || !wristNumber.trim()}
              >
                {updateWristNumberMutation.isPending ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
