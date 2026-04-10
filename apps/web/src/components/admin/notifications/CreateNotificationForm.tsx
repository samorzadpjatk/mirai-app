"use client";

import { useMemo, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { GraphQLClient } from "graphql-request";
import { useQuery } from "@tanstack/react-query";
import {
  useCreateNotificationMutation,
  useSendMobileNotificationsMutation,
} from "@mirai-app/graphql-types";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import { useTrip } from "../../../contexts/TripContext";
import { env } from "../../../lib/env";

type AudienceType = "all" | "group";

const getAuthToken = () => {
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((c) =>
    c.trim().startsWith("sb-access-token="),
  );
  return tokenCookie ? tokenCookie.split("=")[1] : null;
};

const createGraphQLClient = () => {
  return new GraphQLClient(env.graphqlUrl, {
    headers: () => {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return headers;
    },
  });
};

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
  const graphqlClient = useMemo(() => createGraphQLClient(), []);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [groupId, setGroupId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch groups using raw GraphQL query
  const groupsQuery = useQuery({
    queryKey: ["groups", tripId],
    enabled: Boolean(tripId),
    queryFn: async () => {
      const result = await graphqlClient.request<{
        groupsByTrip?: { groups: Group[] };
      }>(GET_GROUPS_QUERY, { tripId });
      return result.groupsByTrip?.groups ?? [];
    },
  });

  const groups = groupsQuery.data ?? [];

  const createNotificationMutation = useCreateNotificationMutation(
    graphqlClient,
    {
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to create notification.";
        appToast.error(message);
        setFormError(message);
      },
    },
  );

  const sendMobileNotificationsMutation = useSendMobileNotificationsMutation(
    graphqlClient,
    {
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to send notification.";
        appToast.error(message);
        setFormError(message);
      },
    },
  );

  const isSubmitting =
    createNotificationMutation.isPending ||
    sendMobileNotificationsMutation.isPending;

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

      try {
        // Create the notification
        const result = await createNotificationMutation.mutateAsync({
          title: normalizedTitle,
          body: normalizedBody,
          url: notificationUrl,
          tripId: tripId || undefined,
        });

        // Send the notification if creation was successful
        if (result?.createNotification?.notification?.id) {
          await sendMobileNotificationsMutation.mutateAsync({
            notificationId: result.createNotification.notification.id,
          });
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
      }
    },
    [
      title,
      body,
      audienceType,
      groupId,
      tripId,
      createNotificationMutation,
      sendMobileNotificationsMutation,
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
