"use client";

import { useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import { useTRPCClient } from "@mirai-app/trpc/client";
import { useAdminNotifications } from "@mirai-app/admin-hooks";
import { useTrip } from "../../../contexts/TripContext";

type AudienceType = "all" | "group";

const buildNotificationUrl = (
  audienceType: AudienceType,
  groupId?: string,
): string => {
  const parsed = new URL("/alerts", "https://integral.local");
  parsed.searchParams.set("__audience", audienceType);
  if (audienceType === "group" && groupId) {
    parsed.searchParams.set("__groupId", groupId);
  }
  return `${parsed.pathname}${parsed.search}`;
};

export function CreateNotificationForm() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const trpcClient = useTRPCClient();
  const { groups } = useAdminNotifications(tripId);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [groupId, setGroupId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sendToAllMutation = useMutation({
    mutationFn: (input: {
      tripId: string;
      title: string;
      body: string;
      url: string;
    }) => trpcClient.notifications.sendToAll.mutate(input),
  });

  const sendToGroupMutation = useMutation({
    mutationFn: (input: {
      tripId: string;
      groupId: string;
      title: string;
      body: string;
      url: string;
    }) => trpcClient.notifications.sendToGroup.mutate(input),
  });

  const isSubmitting =
    sendToAllMutation.isPending || sendToGroupMutation.isPending;

  const groupOptions = useMemo(
    () => [
      { value: "", label: "Select group" },
      ...groups.map((group) => ({ value: group.id, label: group.name })),
    ],
    [groups],
  );

  const onSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (
    event,
  ) => {
    event.preventDefault();
    setFormError(null);

    const normalizedTitle = title.trim();
    const normalizedBody = body.trim();

    if (!normalizedTitle || !normalizedBody) {
      setFormError("Title and description are required.");
      return;
    }

    if (audienceType === "group" && !groupId) {
      setFormError("Select a target group.");
      return;
    }

    const notificationUrl = buildNotificationUrl(audienceType, groupId);
    const toastId = appToast.loading("Sending notification...");

    try {
      if (audienceType === "all") {
        await sendToAllMutation.mutateAsync({
          tripId,
          title: normalizedTitle,
          body: normalizedBody,
          url: notificationUrl,
        });
      } else {
        await sendToGroupMutation.mutateAsync({
          tripId,
          groupId,
          title: normalizedTitle,
          body: normalizedBody,
          url: notificationUrl,
        });
      }

      appToast.dismiss(toastId);
      appToast.success("Notification sent.");
      window.location.href = "/notifications";
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error ? error.message : "Failed to send notification.";
      appToast.error(message);
      setFormError(message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select
        label="Audience"
        value={audienceType}
        onChange={(event) =>
          setAudienceType(event.target.value as AudienceType)
        }
        options={[
          { value: "all", label: "All users" },
          { value: "group", label: "Specific group" },
        ]}
      />

      {audienceType === "group" ? (
        <Select
          label="Group"
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          options={groupOptions}
        />
      ) : null}

      <Input
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Notification title"
        required
      />

      <Input
        label="Description"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Notification body"
        required
      />

      {formError ? <ErrorMessage message={formError} /> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send notification"}
        </Button>
        <a
          href="/notifications"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
