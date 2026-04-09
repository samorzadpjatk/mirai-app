"use client";

import { useMemo, useState } from "react";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import {
  useAdminGroups,
  type AdminGroup as Group,
} from "@mirai-app/frameworks/trpc/hooks";
import { appToast } from "../../../lib/toast";

interface GroupAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  group: Group | null;
}

export function GroupAssignmentModal({
  isOpen,
  onClose,
  tripId,
  group,
}: GroupAssignmentModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { users, usersLoading, assignUserToGroup, isAssigningUser } =
    useAdminGroups(tripId, "");

  const availableUsers = useMemo(() => {
    if (!group) return [];
    return users.filter((user) => {
      const isInGroup = group.participants?.some(
        (p: unknown) => (p as { userId?: string })?.userId === user.id,
      );
      return !isInGroup;
    });
  }, [users, group]);

  const handleAssign = async () => {
    if (!group || !selectedUserId) return;

    const toastId = appToast.loading("Assigning user to group...");

    try {
      await assignUserToGroup({
        userId: selectedUserId,
        tripId,
        groupId: group.id,
      });
      appToast.dismiss(toastId);
      appToast.success("User assigned successfully.");
      setSelectedUserId(null);
      onClose();
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error ? error.message : "Failed to assign user.";
      appToast.error(message);
    }
  };

  const handleClose = () => {
    setSelectedUserId(null);
    onClose();
  };

  if (!group) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign User to Group">
      <div className="space-y-4">
        <div>
          <p className="font-medium text-text-primary">{group.name}</p>
          <p className="text-sm text-text-muted">
            Current members: {group._count.participants}
          </p>
        </div>

        {usersLoading ? (
          <LoadingSpinner label="Loading users..." />
        ) : availableUsers.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No available users to assign.
          </p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {availableUsers.map((user) => {
              const fullName = [user.firstName, user.lastName]
                .filter(Boolean)
                .join(" ");
              const displayName = fullName || (user.email ?? "Unknown");

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedUserId === user.id
                      ? "border-fuchsia-600 bg-fuchsia-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="font-medium text-text-primary">{displayName}</p>
                  {user.email && (
                    <p className="text-sm text-text-muted">{user.email}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || isAssigningUser}
          >
            {isAssigningUser ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
