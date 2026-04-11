"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import {
  useGetUserQuery,
  useUpdateUserMutation,
} from "@mirai-app/graphql-client";
import { graphqlClient } from "../../../lib/graphql-client";
import { appToast } from "../../../lib/toast";
import { useTrip } from "../../../contexts/TripContext";

interface EditUserFormProps {
  userId: string;
}

export function EditUserForm({ userId }: EditUserFormProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";

  const {
    data: userData,
    isLoading,
    error,
  } = useGetUserQuery(
    graphqlClient,
    { id: userId },
    {
      enabled: Boolean(tripId && userId),
    },
  );

  const updateUserMutation = useUpdateUserMutation(graphqlClient);
  const isSaving = updateUserMutation.isPending;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [wristNumber, setWristNumber] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.user) {
      return;
    }

    setFirstName(userData.user.firstName ?? "");
    setLastName(userData.user.lastName ?? "");
    setWristNumber(userData.user.wristNumber ?? "");
    setHouseNumber(userData.user.houseNumber ?? "");
  }, [userData]);

  const canSubmit = useMemo(
    () => firstName.trim().length > 0 && lastName.trim().length > 0,
    [firstName, lastName],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!canSubmit) {
      setFormError("First name and last name are required.");
      return;
    }

    const toastId = appToast.loading("Saving user changes...");

    try {
      await updateUserMutation.mutateAsync({
        input: {
          id: userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          wristNumber: wristNumber || undefined,
          houseNumber: houseNumber || undefined,
        },
      });

      appToast.dismiss(toastId);
      appToast.success("User updated successfully.");
      window.location.href = "/users";
    } catch (submitError) {
      appToast.dismiss(toastId);
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to update user.";
      setFormError(message);
      appToast.error(message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading user..." />;
  }

  if (error || !userData?.user) {
    return <ErrorMessage message="Could not load user details." />;
  }

  const data = userData.user;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="text-lg font-semibold text-text-primary">
          {[data.firstName, data.lastName].filter(Boolean).join(" ") ||
            "Unknown user"}
        </p>
        <p className="text-sm text-text-secondary">
          {data.email ?? "No email"}
        </p>
      </div>

      <Input
        label="First name"
        name="firstName"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
      />

      <Input
        label="Last name"
        name="lastName"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
      />

      <Input
        label="Wrist #"
        name="wristNumber"
        value={wristNumber}
        onChange={(event) => setWristNumber(event.target.value)}
      />

      <Input
        label="House #"
        name="houseNumber"
        value={houseNumber}
        onChange={(event) => setHouseNumber(event.target.value)}
      />

      {formError ? <ErrorMessage message={formError} /> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!canSubmit || isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
        <a
          href="/users"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
