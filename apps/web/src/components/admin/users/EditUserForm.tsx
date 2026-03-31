"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useAdminUsers } from "@mirai-app/shared/hooks";
import { appToast } from "../../../lib/toast";
import { useTrip } from "../../../contexts/TripContext";

interface EditUserFormProps {
  userId: string;
}

export function EditUserForm({ userId }: EditUserFormProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const {
    getUserDetails,
    updateName,
    updateWristNumber,
    updateHouseNumber,
    isUpdatingName,
    isUpdatingWristNumber,
    isUpdatingHouseNumber,
  } = useAdminUsers(tripId, "", "firstName");

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", "details", tripId, userId],
    queryFn: () => getUserDetails(userId),
    enabled: Boolean(tripId && userId),
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [wristNumber, setWristNumber] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }

    setFirstName(data.firstName ?? "");
    setLastName(data.lastName ?? "");
    setWristNumber(data.wristNumber ?? "");
    setHouseNumber(data.houseNumber ?? "");
  }, [data]);

  const isSaving =
    isUpdatingName || isUpdatingWristNumber || isUpdatingHouseNumber;

  const canSubmit = useMemo(
    () => firstName.trim().length > 0 && lastName.trim().length > 0,
    [firstName, lastName],
  );

  const onSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);

    if (!canSubmit) {
      setFormError("First name and last name are required.");
      return;
    }

    const toastId = appToast.loading("Saving user changes...");

    try {
      await updateName({
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      await updateWristNumber({ userId, wristNumber });
      await updateHouseNumber({ userId, houseNumber });

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

  if (error || !data) {
    return <ErrorMessage message="Could not load user details." />;
  }

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
