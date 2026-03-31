"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useAdminUsers } from "@mirai-app/trpc/hooks";
import { appToast } from "../../../lib/toast";
import { useTrip } from "../../../contexts/TripContext";

const isEmailValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function CreateUserForm() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { createUser, isCreatingUser } = useAdminUsers(tripId, "", "firstName");

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().length > 0 &&
      isEmailValid(email.trim())
    );
  }, [email, firstName, lastName]);

  const onSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);

    const nextFirstName = firstName.trim();
    const nextLastName = lastName.trim();
    const nextEmail = email.trim().toLowerCase();

    if (!nextFirstName || !nextLastName || !nextEmail) {
      setFormError("All fields are required.");
      return;
    }

    if (!isEmailValid(nextEmail)) {
      setFormError("Please provide a valid email address.");
      return;
    }

    const toastId = appToast.loading("Creating user...");

    try {
      await createUser({
        tripId,
        firstName: nextFirstName,
        lastName: nextLastName,
        email: nextEmail,
      });
      appToast.dismiss(toastId);
      appToast.success("User created successfully.");
      window.location.href = "/users";
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error ? error.message : "Failed to create user.";
      appToast.error(message);
      setFormError(message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="First name"
        name="firstName"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        placeholder="Enter first name"
        required
      />

      <Input
        label="Last name"
        name="lastName"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
        placeholder="Enter last name"
        required
      />

      <Input
        label="Email"
        type="email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter email"
        required
      />

      {formError ? <ErrorMessage message={formError} /> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!canSubmit || isCreatingUser}>
          {isCreatingUser ? "Creating..." : "Create user"}
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
