import { useMemo, useState } from "react";
import type { UserLocation } from "~/components/map/UserMap";

interface UseMapSelectedUserArgs {
  session?: { user?: { id?: string } } | null;
  users: UserLocation[];
  sharingUserIds: string[];
  updateSharing: (ids: string[]) => Promise<void>;
}

export function useMapSelectedUser({
  session,
  users,
  sharingUserIds,
  updateSharing,
}: UseMapSelectedUserArgs) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const canStopSharing =
    !!selectedUser &&
    selectedUser.id !== session?.user?.id &&
    sharingUserIds.includes(selectedUser.id);

  const selectUser = (user: UserLocation) => setSelectedUserId(user.id);
  const deselect = () => setSelectedUserId("");

  const stopSharing = async () => {
    if (!selectedUser) return;
    const newIds = sharingUserIds.filter((id) => id !== selectedUser.id);
    try {
      await updateSharing(newIds);
    } catch {
      // Error handling is now done in useMapSharing hook
    }
  };

  const mapUserPress = (user: UserLocation) => {
    setSelectedUserId(user.id);
    return user;
  };

  return {
    selectedUserId,
    selectedUser,
    selectUser,
    deselect,
    stopSharing,
    mapUserPress,
    canStopSharing,
  };
}
