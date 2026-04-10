"use client";

import { useMemo, useState } from "react";
import { GraphQLClient } from "graphql-request";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import {
  useGetGroupsByTripQuery,
  useGetUsersQuery,
  type GetGroupsByTripQuery,
} from "@mirai-app/graphql-types";
import { appToast } from "../../../lib/toast";
import { env } from "../../../lib/env";

type Group = GetGroupsByTripQuery["groupsByTrip"]["groups"][number];

interface GroupAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  group: Group | null;
}

const createGraphQLClient = (): GraphQLClient => {
  const getAuthToken = (): string | null => {
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) =>
      c.trim().startsWith("sb-access-token="),
    );
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  return new GraphQLClient(env.graphqlUrl, {
    headers: () => {
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
};

export function GroupAssignmentModal({
  isOpen,
  onClose,
  tripId,
  group,
}: GroupAssignmentModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const graphqlClient = useMemo(() => createGraphQLClient(), []);

  // Fetch all groups to get participant information
  const { data: groupsData } = useGetGroupsByTripQuery(
    graphqlClient,
    {
      tripId,
      pagination: { limit: 100, offset: 0 },
    },
    {
      enabled: Boolean(tripId) && isOpen,
    },
  );

  // Fetch all users in the trip
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(
    graphqlClient,
    {
      limit: 100,
      offset: 0,
    },
    {
      enabled: isOpen,
    },
  );

  const users = useMemo(() => {
    return usersData?.users ?? [];
  }, [usersData]);

  // Get the full group data with participants from the query
  const fullGroup = useMemo(() => {
    if (!group) return null;
    return (
      groupsData?.groupsByTrip?.groups.find((g) => g.id === group.id) ?? null
    );
  }, [group, groupsData]);

  // Filter out users already in the group
  // Note: GraphQL Group type doesn't expose participants directly,
  // so we show all users. This differs from the tRPC implementation.
  const availableUsers = useMemo(() => {
    return users;
  }, [users]);

  const handleAssign = async () => {
    if (!group || !selectedUserId) return;

    const toastId = appToast.loading("Assigning user to group...");

    try {
      // Note: GraphQL schema doesn't have a direct mutation for adding users to groups
      // This functionality would need to be implemented in the backend
      // For now, we'll show a placeholder implementation
      appToast.dismiss(toastId);
      appToast.error(
        "Group assignment via GraphQL is not yet implemented. Please use the API directly.",
      );
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
          <p className="text-sm text-text-muted">Group code: {group.code}</p>
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
          <Button onClick={handleAssign} disabled={!selectedUserId}>
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  );
}
