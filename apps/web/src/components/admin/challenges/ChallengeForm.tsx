"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation } from "urql";
import { Input } from "../../ui/Input";
import { TimeInput } from "../../ui/TimeInput";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { appToast } from "../../../lib/toast";
import {
  GetChallengeDocument,
  CreateChallengeDocument,
  UpdateChallengeDocument,
  type CreateChallengeInput,
  type UpdateChallengeInput,
  type Challenge,
} from "@mirai-app/graphql-types/urql";
import { useChallengeForm } from "../../../hooks/admin/useChallengeForm";
import { useWebFileUpload } from "../../../hooks/useWebFileUpload";
import { useTrip } from "../../../contexts/TripContext";
import {
  type ChallengeStatus,
  inferRecurringDaysFromWindow,
  toIsoFromLocalDateTime,
  toLocalDateTimeInputValue,
  toLocalTimeInputValue,
  toOptionalFloat,
  toOptionalInt,
  toVotingDurationDraft,
  toVotingDurationHours,
} from "./challengeFormConstants";

interface ChallengeFormProps {
  mode: "create" | "edit";
  challengeId?: string;
}

const createStoragePath = (tripId: string, fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `challenge/${tripId}/cover-${Date.now()}.${extension}`;
};

const normalizeChallengeRecord = (challenge: Challenge | null | undefined) => {
  if (!challenge) {
    return null;
  }

  return {
    id: challenge.id,
    name: challenge.name ?? "",
    description: challenge.description ?? "",
    image: challenge.image ?? "",
    submissionType: challenge.submissionType,
    scoringCategory: challenge.scoringCategory,
    isRecurring: challenge.isRecurring ?? false,
    dailyStartTime: challenge.dailyStartTime ?? "",
    dailyEndTime: challenge.dailyEndTime ?? "",
    basePoints: challenge.basePoints ?? null,
    firstPlacePoints: challenge.firstPlacePoints ?? null,
    secondPlacePoints: challenge.secondPlacePoints ?? null,
    thirdPlacePoints: challenge.thirdPlacePoints ?? null,
    status: challenge.status,
    startTime: challenge.startTime ?? null,
    endTime: challenge.endTime ?? null,
    votingStartTime: null as string | null,
    votingEndTime: null as string | null,
    targetLatitude: challenge.targetLatitude ?? null,
    targetLongitude: challenge.targetLongitude ?? null,
    qrCodeValue: challenge.expectedValue ?? "",
    textExpectedPhrase:
      challenge.submissionType === "TEXT"
        ? (challenge.expectedValue ?? "")
        : "",
    autoApprove: challenge.autoApprove ?? false,
  };
};

export function ChallengeForm({ mode, challengeId }: ChallengeFormProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const isEditMode = mode === "edit";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    form,
    updateField,
    setSubmissionType,
    setScoringCategory,
    setAutoApprove,
    setStatus,
    resetForm,
    submissionTypeOptions,
    scoringOptions,
    statusOptions,
    isPeerVoting,
    showPodiumPoints,
    isAutoApproveForced,
    isAutoApproveDisabled,
    needsLocation,
  } = useChallengeForm({
    isNewChallenge: !isEditMode,
  });

  const {
    status: uploadStatus,
    progress: uploadProgress,
    error: uploadError,
    selectedFile,
    previewUrl,
    onFileInputChange,
    clearSelection,
    upload,
    verifyFileAccessible,
  } = useWebFileUpload();

  // GraphQL query for challenge details using urql
  const [challengeResult] = useQuery({
    query: GetChallengeDocument,
    variables: { id: challengeId ?? "", tripId },
    pause: !isEditMode || !challengeId || !tripId,
  });

  const challengeData = challengeResult.data?.challenge;
  const challengeFetching = challengeResult.fetching;

  useEffect(() => {
    if (!isEditMode || !challengeData) {
      return;
    }

    const source = normalizeChallengeRecord(challengeData);
    if (!source) return;

    const votingDraft = toVotingDurationDraft(
      source.votingStartTime,
      source.votingEndTime,
    );

    resetForm({
      title: source.name,
      description: source.description,
      image: source.image,
      submissionType: source.submissionType,
      scoringCategory: source.scoringCategory,
      isRecurring: source.isRecurring,
      dailyStartTime: toLocalTimeInputValue(source.dailyStartTime),
      dailyEndTime: toLocalTimeInputValue(source.dailyEndTime),
      recurringDays: source.isRecurring
        ? inferRecurringDaysFromWindow(source.startTime, source.endTime)
        : "",
      basePoints: source.basePoints != null ? String(source.basePoints) : "",
      firstPlacePoints:
        source.firstPlacePoints != null ? String(source.firstPlacePoints) : "",
      secondPlacePoints:
        source.secondPlacePoints != null
          ? String(source.secondPlacePoints)
          : "",
      thirdPlacePoints:
        source.thirdPlacePoints != null ? String(source.thirdPlacePoints) : "",
      status: source.status as ChallengeStatus,
      startTime: toLocalDateTimeInputValue(source.startTime),
      endTime: toLocalDateTimeInputValue(source.endTime),
      votingDurationValue: votingDraft.value,
      votingDurationUnit: votingDraft.unit,
      targetLatitude:
        source.targetLatitude != null ? String(source.targetLatitude) : "",
      targetLongitude:
        source.targetLongitude != null ? String(source.targetLongitude) : "",
      qrCodeValue: source.qrCodeValue,
      textExpectedPhrase: source.textExpectedPhrase,
      autoApprove: source.autoApprove,
    });
  }, [challengeData, isEditMode, resetForm]);

  // GraphQL mutations using urql
  const [, createChallenge] = useMutation(CreateChallengeDocument);
  const [, updateChallenge] = useMutation(UpdateChallengeDocument);

  const [isSaving, setIsSaving] = useState(false);
  const isUploading = uploadStatus === "uploading";

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.description.trim().length > 0;
  }, [form.description, form.title]);

  const validate = (): string | null => {
    if (!form.title.trim() || !form.description.trim()) {
      return "Title and description are required.";
    }

    if (form.isRecurring) {
      if (!form.dailyStartTime || !form.dailyEndTime) {
        return "Daily start and end time are required for recurring challenges.";
      }
      const recurringDays = toOptionalInt(form.recurringDays);
      if (!recurringDays || recurringDays < 1 || recurringDays > 30) {
        return "Recurring days must be between 1 and 30.";
      }
    } else if (
      (form.startTime && !form.endTime) ||
      (!form.startTime && form.endTime)
    ) {
      return "Provide both start and end time, or leave both empty.";
    }

    if (
      isPeerVoting &&
      !toVotingDurationHours(form.votingDurationValue, form.votingDurationUnit)
    ) {
      return "Peer voting duration is required and must be at least 1.";
    }

    if (form.submissionType === "QR_CODE" && !form.qrCodeValue.trim()) {
      return "Expected QR code value is required for QR challenges.";
    }

    if (
      form.submissionType === "TEXT" &&
      form.autoApprove &&
      !form.textExpectedPhrase.trim()
    ) {
      return "Expected phrase is required when text auto-approve is enabled.";
    }

    if (needsLocation) {
      const lat = toOptionalFloat(form.targetLatitude);
      const lng = toOptionalFloat(form.targetLongitude);
      if (lat == null || lng == null) {
        return "Latitude and longitude are required for location-based challenges.";
      }
    }

    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (isEditMode && !challengeId) {
      setFormError("Missing challenge id.");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (isUploading) {
      setFormError("Please wait for the cover upload to finish.");
      return;
    }

    setIsSaving(true);
    const toastId = appToast.loading(
      isEditMode ? "Updating challenge..." : "Creating challenge...",
    );

    try {
      let uploadedStoragePath = form.image || "";

      if (selectedFile) {
        const storagePath = createStoragePath(tripId, selectedFile.name);
        const uploadResult = await upload({
          storagePath,
          file: selectedFile,
          upsert: true,
        });

        uploadedStoragePath = uploadResult.storagePath;
        await verifyFileAccessible(uploadResult.storagePath);
      }

      const basePayload = {
        tripId,
        name: form.title.trim(),
        description: form.description.trim() || null,
        image: uploadedStoragePath || null,
        submissionType: form.submissionType,
        scoringCategory: form.scoringCategory,
        isRecurring: form.isRecurring,
        dailyStartTime: form.isRecurring ? form.dailyStartTime || null : null,
        dailyEndTime: form.isRecurring ? form.dailyEndTime || null : null,
        recurringDays: form.isRecurring
          ? toOptionalInt(form.recurringDays)
          : null,
        basePoints: toOptionalInt(form.basePoints),
        firstPlacePoints: showPodiumPoints
          ? toOptionalInt(form.firstPlacePoints)
          : null,
        secondPlacePoints: showPodiumPoints
          ? toOptionalInt(form.secondPlacePoints)
          : null,
        thirdPlacePoints: showPodiumPoints
          ? toOptionalInt(form.thirdPlacePoints)
          : null,
        status: form.status,
        startTime: !form.isRecurring
          ? toIsoFromLocalDateTime(form.startTime)
          : null,
        endTime: !form.isRecurring
          ? toIsoFromLocalDateTime(form.endTime)
          : null,
        votingDurationHours: isPeerVoting
          ? toVotingDurationHours(
              form.votingDurationValue,
              form.votingDurationUnit,
            )
          : null,
        targetLatitude: needsLocation
          ? toOptionalFloat(form.targetLatitude)
          : null,
        targetLongitude: needsLocation
          ? toOptionalFloat(form.targetLongitude)
          : null,
        qrCodeValue:
          form.submissionType === "QR_CODE"
            ? form.qrCodeValue.trim() || null
            : null,
        textExpectedPhrase:
          form.submissionType === "TEXT"
            ? form.textExpectedPhrase.trim() || null
            : null,
        autoApprove: isAutoApproveForced
          ? true
          : isAutoApproveDisabled
            ? false
            : form.autoApprove,
      };

      if (isEditMode) {
        const result = await updateChallenge({
          input: {
            ...basePayload,
            id: challengeId!,
          } as UpdateChallengeInput,
        });

        if (result.error) {
          throw result.error;
        }

        appToast.success("Challenge updated successfully.");
        window.location.href = "/challenges";
      } else {
        const result = await createChallenge({
          input: basePayload as CreateChallengeInput,
        });

        if (result.error) {
          throw result.error;
        }

        appToast.success("Challenge created successfully.");
        window.location.href = "/challenges";
      }

      appToast.dismiss(toastId);
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Failed to update challenge."
            : "Failed to create challenge.";
      setFormError(message);
      appToast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditMode && challengeFetching) {
    return <LoadingSpinner label="Loading challenge..." />;
  }

  if (isEditMode && !challengeData) {
    return <ErrorMessage message="Could not load challenge details." />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border-subtle bg-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Basics
        </h3>

        <Input
          label="Challenge title"
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="e.g. Campus Marathon"
          required
        />

        <Input
          label="Description"
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Describe the goal"
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Cover image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileInputChange}
            className="block w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary"
          />

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Cover preview"
              className="h-48 w-full rounded-lg border border-border-subtle object-cover"
            />
          ) : form.image ? (
            <img
              src={form.image}
              alt="Current cover"
              className="h-48 w-full rounded-lg border border-border-subtle object-cover"
            />
          ) : null}

          {isUploading ? (
            <p className="text-sm text-text-secondary">
              Uploading image
              {uploadProgress.percent != null
                ? ` ${Math.round(uploadProgress.percent * 100)}%`
                : "..."}
            </p>
          ) : null}

          {selectedFile ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => clearSelection()}
            >
              Clear selected file
            </Button>
          ) : null}

          {uploadError ? <ErrorMessage message={uploadError} /> : null}
        </div>

        <Select
          label="Submission type"
          value={form.submissionType}
          onChange={(event) => setSubmissionType(event.target.value)}
          options={submissionTypeOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        {form.submissionType === "QR_CODE" ? (
          <Input
            label="Expected QR code value"
            value={form.qrCodeValue}
            onChange={(event) => updateField("qrCodeValue", event.target.value)}
          />
        ) : null}

        {form.submissionType === "TEXT" ? (
          <Input
            label="Expected phrase"
            value={form.textExpectedPhrase}
            onChange={(event) =>
              updateField("textExpectedPhrase", event.target.value)
            }
            placeholder="Used for text auto-approve"
          />
        ) : null}

        {needsLocation ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Latitude"
              value={form.targetLatitude}
              onChange={(event) =>
                updateField("targetLatitude", event.target.value)
              }
              placeholder="e.g. 52.2297"
            />
            <Input
              label="Longitude"
              value={form.targetLongitude}
              onChange={(event) =>
                updateField("targetLongitude", event.target.value)
              }
              placeholder="e.g. 21.0122"
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-border-subtle bg-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Scoring
        </h3>

        <Select
          label="Scoring category"
          value={form.scoringCategory}
          onChange={(event) => setScoringCategory(event.target.value)}
          options={scoringOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        <Input
          label="Base points"
          value={form.basePoints}
          onChange={(event) => updateField("basePoints", event.target.value)}
          placeholder="0"
        />

        {showPodiumPoints ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              label="1st place"
              value={form.firstPlacePoints}
              onChange={(event) =>
                updateField("firstPlacePoints", event.target.value)
              }
            />
            <Input
              label="2nd place"
              value={form.secondPlacePoints}
              onChange={(event) =>
                updateField("secondPlacePoints", event.target.value)
              }
            />
            <Input
              label="3rd place"
              value={form.thirdPlacePoints}
              onChange={(event) =>
                updateField("thirdPlacePoints", event.target.value)
              }
            />
          </div>
        ) : null}

        {isPeerVoting ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Voting duration"
              value={form.votingDurationValue}
              onChange={(event) =>
                updateField("votingDurationValue", event.target.value)
              }
              placeholder="e.g. 24"
            />
            <Select
              label="Duration unit"
              value={form.votingDurationUnit}
              onChange={(event) =>
                updateField(
                  "votingDurationUnit",
                  event.target.value as "HOURS" | "DAYS",
                )
              }
              options={[
                { value: "HOURS", label: "Hours" },
                { value: "DAYS", label: "Days" },
              ]}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-border-subtle bg-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Schedule
        </h3>

        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(event) =>
              updateField("isRecurring", event.target.checked)
            }
          />
          Recurring challenge
        </label>

        {form.isRecurring ? (
          <div className="grid gap-3 md:grid-cols-3">
            <TimeInput
              label="Daily start"
              value={form.dailyStartTime}
              onChange={(event) =>
                updateField("dailyStartTime", event.target.value)
              }
            />
            <TimeInput
              label="Daily end"
              value={form.dailyEndTime}
              onChange={(event) =>
                updateField("dailyEndTime", event.target.value)
              }
            />
            <Input
              label="Recurring days"
              value={form.recurringDays}
              onChange={(event) =>
                updateField("recurringDays", event.target.value)
              }
              placeholder="e.g. 7"
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Start"
              type="datetime-local"
              value={form.startTime}
              onChange={(event) => updateField("startTime", event.target.value)}
            />
            <Input
              label="End"
              type="datetime-local"
              value={form.endTime}
              onChange={(event) => updateField("endTime", event.target.value)}
            />
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-border-subtle bg-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Advanced
        </h3>

        <Select
          label="Status"
          value={form.status}
          onChange={(event) => setStatus(event.target.value)}
          options={statusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={
              isAutoApproveForced
                ? true
                : isAutoApproveDisabled
                  ? false
                  : form.autoApprove
            }
            onChange={(event) => setAutoApprove(event.target.checked)}
            disabled={isAutoApproveForced || isAutoApproveDisabled}
          />
          Auto-approve submissions
        </label>
      </section>

      {formError ? <ErrorMessage message={formError} /> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!canSubmit || isSaving || isUploading}>
          {isSaving
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
              ? "Update challenge"
              : "Create challenge"}
        </Button>
        <a
          href="/challenges"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
