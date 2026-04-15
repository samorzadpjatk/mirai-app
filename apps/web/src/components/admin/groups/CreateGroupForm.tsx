"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import {
  useCreateGroupMutation,
  useGetUsersQuery,
} from "@mirai-app/graphql-client/urql";
import { appToast } from "../../../lib/toast";
import { useTrip } from "../../../contexts/TripContext";

export function CreateGroupForm() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [groupName, setGroupName] = useState("");
  const [selectedOrganizerId, setSelectedOrganizerId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [{ data: usersData, fetching: usersLoading }] = useGetUsersQuery({
    variables: {
      limit: 100,
      offset: 0,
    },
    pause: !tripId,
  });

  const [, createGroup] = useCreateGroupMutation();

  const users = useMemo(() => usersData?.users ?? [], [usersData]);

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

    const toastId = appToast.loading("Creating group...");

    try {
      const result = await createGroup({
        input: {
          tripId,
          name,
          organizerId: selectedOrganizerId || undefined,
        },
      });

      if (result.error) {
        throw result.error;
      }

      appToast.dismiss(toastId);
      appToast.success("Group created successfully.");
      window.location.href = "/groups";
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error ? error.message : "Failed to create group.";
      appToast.error(message);
      setFormError(message);
    }
  };

  return (
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
        <Button type="submit" disabled={!canSubmit || usersLoading}>
          {usersLoading ? "Creating..." : "Create group"}
        </Button>
        <a
          href="/groups"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
