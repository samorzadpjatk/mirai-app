"use client";

import { useEffect, useState } from "react";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import {
  useCreateCustomActivityMutation,
  useUpdateActivityMutation,
  useGetActivityQuery,
} from "@mirai-app/graphql-types";
import { useWebFileUpload } from "../../../hooks/useWebFileUpload";
import { useTrip } from "../../../contexts/TripContext";

interface ActivityFormProps {
  mode: "create" | "edit";
  activityId?: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function ActivityForm({ mode, activityId }: ActivityFormProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";

  const [{ data: activityResult, fetching: isActivityLoading }] =
    useGetActivityQuery({
      variables: { id: activityId! },
      pause: mode !== "edit" || !Boolean(activityId),
    });
  const activity = activityResult?.activity;

  const [, createCustom] = useCreateCustomActivityMutation();
  const [, updateActivity] = useUpdateActivityMutation();

  const isBusy = createCustom.fetching || updateActivity.fetching;

  const {
    selectedFile,
    previewUrl,
    onFileInputChange,
    clearSelection,
    upload,
  } = useWebFileUpload();

  const activityTitle =
    isObject(activity) && typeof activity.title === "string"
      ? activity.title
      : "";
  const activityDescription =
    isObject(activity) && typeof activity.description === "string"
      ? activity.description
      : "";
  const activityPinned =
    isObject(activity) && typeof activity.isPinned === "boolean"
      ? activity.isPinned
      : false;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  if (mode === "edit" && isActivityLoading) {
    return <LoadingSpinner label="Loading activity..." />;
  }

  if (mode === "edit" && !activity) {
    return <ErrorMessage message="Activity not found." />;
  }

  useEffect(() => {
    if (mode !== "edit" || !activity) {
      return;
    }

    setTitle(activityTitle);
    setDescription(activityDescription);
    setIsPinned(activityPinned);
  }, [activity, mode, activityTitle, activityDescription, activityPinned]);

  const handleSubmit = async () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      appToast.error("Title is required.");
      return;
    }

    let imagePath: string | null = null;
    if (selectedFile) {
      const extension = selectedFile.name.split(".").pop() ?? "jpg";
      const storagePath = `activity/${tripId}/custom-${Date.now()}.${extension}`;
      const uploaded = await upload({
        storagePath,
        file: selectedFile,
        upsert: true,
      });
      imagePath = uploaded.storagePath;
    }

    const toastId = appToast.loading(
      mode === "create" ? "Creating activity..." : "Updating activity...",
    );
    try {
      if (mode === "create") {
        const result = await createCustom({
          input: {
            tripId,
            title: normalizedTitle,
            description: description.trim() || null,
            imageUrl: imagePath,
            isPinned,
          },
        });
        if (result.error) {
          throw result.error;
        }
        appToast.dismiss(toastId);
        appToast.success("Activity created.");
        window.location.href = "/activity";
      } else {
        const payload: {
          activityId: string;
          title?: string;
          description?: string | null;
          isPinned?: boolean;
        } = { activityId: activityId! };

        if (normalizedTitle !== activityTitle) {
          payload.title = normalizedTitle;
        }

        const normalizedDescription = description.trim();
        if (normalizedDescription !== activityDescription) {
          payload.description = normalizedDescription || null;
        }

        if (isPinned !== activityPinned) {
          payload.isPinned = isPinned;
        }

        if (Object.keys(payload).length === 1) {
          appToast.dismiss(toastId);
          appToast.info("No changes to save.");
          return;
        }

        const result = await updateActivity({ input: payload });
        if (result.error) {
          throw result.error;
        }
        appToast.dismiss(toastId);
        appToast.success("Activity updated.");
        window.location.href = "/activity";
      }
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(error instanceof Error ? error.message : "Save failed.");
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-text-primary">
          {mode === "create" ? "Create Activity" : "Edit Activity"}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {mode === "create"
            ? "Add custom activity to the feed."
            : "Update activity information."}
        </p>
      </header>

      <Card className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Activity title"
        />
        <Input
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional description"
        />

        {mode === "create" ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">
              Image
            </label>
            <input type="file" accept="image/*" onChange={onFileInputChange} />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-36 w-full rounded-lg border border-border-subtle object-cover"
              />
            ) : null}
            {selectedFile ? (
              <Button variant="ghost" onClick={clearSelection}>
                Remove image
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            Image is read-only for existing activity.
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            id="isPinned"
            type="checkbox"
            checked={isPinned}
            onChange={(event) => setIsPinned(event.target.checked)}
          />
          <label htmlFor="isPinned" className="text-sm text-text-secondary">
            Pin to top
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button disabled={isBusy} onClick={() => void handleSubmit()}>
            {isBusy
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
                ? "Create Activity"
                : "Save Changes"}
          </Button>
          <a
            href="/activity"
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </a>
        </div>
      </Card>
    </section>
  );
}
