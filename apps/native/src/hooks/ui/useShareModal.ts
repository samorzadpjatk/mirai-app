import { useState } from "react";

interface UseShareModalArgs {
  initialOpen?: boolean;
  sharingUserIds?: string[];
  updateSharing?: (ids: string[]) => Promise<void>;
}

export function useShareModal({
  initialOpen = false,
  sharingUserIds = [],
  updateSharing,
}: UseShareModalArgs) {
  const [open, setOpen] = useState<boolean>(initialOpen);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const toggleSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const reset = () => {
    setOpen(false);
    setSearchQuery("");
    setSelectedUsers(new Set());
  };

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const confirm = async () => {
    const newIds = [...new Set([...sharingUserIds, ...Array.from(selectedUsers)])];
    try {
      await updateSharing?.(newIds);
    } catch {
      // Error handling is done in useMapSharing hook
    }
    reset();
  };

  return {
    open,
    openModal,
    closeModal,
    searchQuery,
    setSearchQuery,
    selectedUsers,
    toggleSelectedUser,
    reset,
    confirm,
  };
}
