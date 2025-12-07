"use client";

import { useState } from "react";
import { Button, Flex, TextField, Text, Dialog } from "@radix-ui/themes";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

interface HouseNumberManagerProps {
  userId: string;
  userName: string;
  currentHouseNumber?: string | null;
}

export default function HouseNumberManager({ 
  userId, 
  userName, 
  currentHouseNumber 
}: HouseNumberManagerProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [houseNumber, setHouseNumber] = useState(currentHouseNumber ?? "");
  const [error, setError] = useState("");

  const updateHouseNumberMutation = api.user.updateHouseNumber.useMutation({
    onSuccess: () => {
      setIsDialogOpen(false);
      setError("");
      router.refresh();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const removeHouseNumberMutation = api.user.removeHouseNumber.useMutation({
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
    if (!houseNumber.trim()) {
      setError("House number cannot be empty");
      return;
    }
    
    setError("");
    updateHouseNumberMutation.mutate({
      userId,
      houseNumber: houseNumber.trim(),
    });
  };

  const handleRemove = () => {
    setError("");
    removeHouseNumberMutation.mutate({ userId });
  };

  const handleOpenDialog = () => {
    setHouseNumber(currentHouseNumber ?? "");
    setError("");
    setIsDialogOpen(true);
  };

  return (
    <>
      <Button
        size="1"
        variant="soft"
        color={currentHouseNumber ? "green" : "gray"}
        onClick={handleOpenDialog}
      >
        <PlusIcon />
        {currentHouseNumber ? "Change house number" : "Assign house number"}
      </Button>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>
            {currentHouseNumber ? "Change house number" : "Assign house number"}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {currentHouseNumber 
              ? `Change house number for user: ${userName}`
              : `Assign house number for user: ${userName}`
            }
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <div>
              <Text as="div" size="2" mb="1" weight="bold">
                Numer domku
              </Text>
              <TextField.Root
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="Type house number..."
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
              {currentHouseNumber && (
                <Button
                  variant="soft"
                  color="red"
                  onClick={handleRemove}
                  disabled={removeHouseNumberMutation.isPending}
                >
                  <TrashIcon />
                  {removeHouseNumberMutation.isPending ? "Removing..." : "Remove house number"}
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
                disabled={updateHouseNumberMutation.isPending || !houseNumber.trim()}
              >
                {updateHouseNumberMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
