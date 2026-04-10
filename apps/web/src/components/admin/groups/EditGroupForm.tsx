"use client";

import { useMemo, useState, useEffect } from "react";
import { GraphQLClient } from "graphql-request";
import type { FormEvent } from "react";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import {
  useGetGroupQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetUsersQuery,
  type GetGroupQuery,
} from "@mirai-app/graphql-types";
import { appToast } from "../../../lib/toast";
import { useTrip } from "../../../contexts/TripContext";
import { env } from "../../../lib/env";

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

interface EditGroupFormProps {
  groupId: string;
}

export function EditGroupForm({ groupId }: EditGroupFormProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [groupName, setGroupName] = useState("");
  const [selectedOrganizerId, setSelectedOrganizerId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const graphqlClient = useMemo(() => createGraphQLClient(), []);

  const {
    data: groupData,
    isLoading: isLoadingGroup,
    error: groupError,
  } = useGetGroupQuery(
    graphqlClient,
    { id: groupId },
    {
      enabled: Boolean(groupId),
    },
  );

  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(
    graphqlClient,
    {
      limit: 100,
      offset: 0,
    },
    {
      enabled: Boolean(tripId),
    },
  );

  const group = useMemo(() => groupData?.group ?? null, [groupData]);
  const users = useMemo(() => usersData?.users ?? [], [usersData]);

  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setSelectedOrganizerId(group.organizer?.id ?? "");
    }
  }, [group]);

  const updateGroupMutation = useUpdateGroupMutation(graphqlClient, {
    onSuccess: () => {
      appToast.success("Group updated successfully.");
      window.location.href = "/groups";
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to update group.";
      appToast.error(message);
      setFormError(message);
    },
  });

  const deleteGroupMutation = useDeleteGroupMutation(graphqlClient, {
    onSuccess: () => {
      appToast.success("Group deleted successfully.");
      window.location.href = "/groups";
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete group.";
      appToast.error(message);
    },
  });

  const organizerOptions = useMemo(() => {
    const options = [{ value: "", label: "Select organizer (optional)" }];
    users.forEach((user) => {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
      options.push({
        value: user.id,
        label: fullName || (user.email ?? "Unknown"),
      });
    });
    return options;
  }, [users]);

  const canSubmit = useMemo(() => {
    return groupName.trim().length > 0;
  }, [groupName]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const name = groupName.trim();
    if (!name) {
      setFormError("Group name is required.");
      return;
    }

    const toastId = appToast.loading("Updating group...");

    try {
      await updateGroupMutation.mutateAsync({
        input: {
          id: groupId,
          name,
          organizerId: selectedOrganizerId || undefined,
        },
      });
      appToast.dismiss(toastId);
    } catch {
      appToast.dismiss(toastId);
    }
  };

  const handleDelete = async () => {
    const toastId = appToast.loading("Deleting group...");

    try {
      await deleteGroupMutation.mutateAsync({ id: groupId });
      appToast.dismiss(toastId);
    } catch {
      appToast.dismiss(toastId);
    }
  };

  if (isLoadingGroup) {
    return <LoadingSpinner label="Loading group..." />;
  }

  if (groupError || !group) {
    return <ErrorMessage message="Group not found." />;
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Group Name"
          name="groupName"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          placeholder="Enter group name"
          required
        />

        <Select
          label="Organizer"
          name="organizerId"
          value={selectedOrganizerId}
          onChange={(event) => setSelectedOrganizerId(event.target.value)}
          options={organizerOptions}
          disabled={usersLoading}
        />

        {formError ? <ErrorMessage message={formError} /> : null}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={!canSubmit || updateGroupMutation.isPending}
          >
            {updateGroupMutation.isPending ? "Updating..." : "Update group"}
          </Button>
          <a
            href="/groups"
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </a>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-auto text-sm text-red-600 hover:text-red-700"
          >
            Delete group
          </button>
        </div>
      </form>

      <Modal
        isOpen={showDeleteConfirm}
        title="Delete Group"
        onClose={() => setShowDeleteConfirm(false)}
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete the group &quot;{group.name}&quot;?
          </p>
          <p className="text-sm text-text-muted">
            This action cannot be undone and will remove all members from the
            group.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteGroupMutation.isPending}
            >
              {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
