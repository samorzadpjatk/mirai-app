"use client";

import { useMemo, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation } from "urql";
import {
  CreateNotificationDocument,
  SendMobileNotificationsDocument,
} from "@mirai-app/frameworks/graphql/urql";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
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

// GraphQL query for fetching groups - using raw query since we may need a specific query
const GET_GROUPS_QUERY = `
  query GetGroupsByTrip($tripId: ID!) {
    groupsByTrip(tripId: $tripId) {
      groups {
        id
        name
      }
    }
  }
`;

interface Group {
  id: string;
  name: string;
}

export function CreateNotificationForm() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [groupId, setGroupId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch groups using urql
  const [groupsResult] = useQuery({
    query: GET_GROUPS_QUERY,
    variables: { tripId },
    pause: !tripId,
  });

  const groups = useMemo(() => {
    const data = groupsResult.data?.groupsByTrip?.groups;
    return Array.isArray(data) ? data : [];
  }, [groupsResult.data]);

  // Create notification mutation using urql
  const [, createNotification] = useMutation(CreateNotificationDocument);

  // Send mobile notifications mutation using urql
  const [, sendMobileNotifications] = useMutation(
    SendMobileNotificationsDocument,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupOptions = useMemo(
    () => [
      { value: "", label: "Select group" },
      ...groups.map((group) => ({ value: group.id, label: group.name })),
    ],
    [groups],
  );

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
      setIsSubmitting(true);

      try {
        // Create the notification
        const result = await createNotification({
          input: {
            title: normalizedTitle,
            body: normalizedBody,
            url: notificationUrl,
            tripId: tripId || undefined,
          },
        });

        if (result.error) {
          throw result.error;
        }

        // Send the notification if creation was successful
        if (result.data?.createNotification?.notification?.id) {
          const sendResult = await sendMobileNotifications({
            input: {
              notificationId: result.data.createNotification.notification.id,
            },
          });

          if (sendResult.error) {
            throw sendResult.error;
          }
        }

        appToast.dismiss(toastId);
        appToast.success("Notification sent.");
        window.location.href = "/notifications";
      } catch (error) {
        appToast.dismiss(toastId);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to send notification.";
        appToast.error(message);
        setFormError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      title,
      body,
      audienceType,
      groupId,
      tripId,
      createNotification,
      sendMobileNotifications,
    ],
  );

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
