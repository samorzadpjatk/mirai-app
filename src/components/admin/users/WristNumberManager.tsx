"use client";

import { useState } from "react";
import { Button, Flex, TextField, Text, Dialog } from "@radix-ui/themes";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

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

  const updateWristNumberMutation = api.user.updateWristNumber.useMutation({
    onSuccess: () => {
      setIsDialogOpen(false);
      setError("");
      router.refresh();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const removeWristNumberMutation = api.user.removeWristNumber.useMutation({
    onSuccess: () => {
      setIsDialogOpen(false);
      setError("");
      router.refresh();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSave = () => {
    if (!wristNumber.trim()) {
      setError("Wrist number cannot be empty");
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
        {currentWristNumber ? "Change wrist number" : "Assign wrist number"}
      </Button>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>
            {currentWristNumber ? "Change wrist number" : "Assign wrist number"}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {currentWristNumber 
              ? `Change wrist number for user: ${userName}`
              : `Assign wrist number for user: ${userName}`
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
                placeholder="Type wrist number..."
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
                  {removeWristNumberMutation.isPending ? "Removing..." : "Remove wrist number"}
                </Button>
              )}
            </div>
            
            <Flex gap="3">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleSave}
                disabled={updateWristNumberMutation.isPending || !wristNumber.trim()}
              >
                {updateWristNumberMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
