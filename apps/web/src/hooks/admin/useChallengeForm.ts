"use client";

import { useMemo, useState } from "react";
import {
  editChallengeStatusOptions,
  newChallengeStatusOptions,
  scoringCategoryOptions,
  submissionTypeOptions,
  type ChallengeStatus,
  type ChallengeFormState,
} from "../../components/admin/challenges/challengeFormConstants";

interface UseChallengeFormOptions {
  isNewChallenge?: boolean;
  initialData?: Partial<ChallengeFormState>;
}

const defaultFormState: ChallengeFormState = {
  title: "",
  description: "",
  image: "",
  submissionType: "IMAGE",
  scoringCategory: "SPEED",
  isRecurring: false,
  dailyStartTime: "",
  dailyEndTime: "",
  recurringDays: "",
  basePoints: "",
  firstPlacePoints: "",
  secondPlacePoints: "",
  thirdPlacePoints: "",
  status: "HIDDEN",
  startTime: "",
  endTime: "",
  votingDurationValue: "",
  votingDurationUnit: "HOURS",
  targetLatitude: "",
  targetLongitude: "",
  qrCodeValue: "",
  textExpectedPhrase: "",
  autoApprove: false,
};

export function useChallengeForm(options: UseChallengeFormOptions = {}) {
  const isNewChallenge = options.isNewChallenge ?? true;

  const buildInitialState = (): ChallengeFormState => ({
    ...defaultFormState,
    ...options.initialData,
  });

  const [form, setForm] = useState<ChallengeFormState>({
    ...buildInitialState(),
  });

  const setStatus = (value: string) => {
    const allowed: ChallengeStatus[] = isNewChallenge
      ? ["HIDDEN", "VISIBLE"]
      : [
          "HIDDEN",
          "VISIBLE",
          "ACTIVE",
          "VOTING_PHASE",
          "COMPLETED",
          "CANCELLED",
        ];

    if (allowed.includes(value as ChallengeStatus)) {
      updateField("status", value as ChallengeStatus);
    }
  };

  const updateField = <K extends keyof ChallengeFormState>(
    key: K,
    value: ChallengeFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const isPeerVoting = form.scoringCategory === "PEER_VOTING";

  const canUsePeerVoting =
    form.submissionType === "IMAGE" || form.submissionType === "VIDEO";

  const showPodiumPoints = form.scoringCategory !== "UNLIMITED";

  const isAutoApproveForced =
    form.submissionType === "QR_CODE" || form.submissionType === "LOCATION";

  const isAutoApproveDisabled =
    form.submissionType === "IMAGE" ||
    form.submissionType === "VIDEO" ||
    form.submissionType === "IMAGE_LOCATION";

  const needsLocation =
    form.submissionType === "LOCATION" ||
    form.submissionType === "IMAGE_LOCATION";

  const scoringOptions = useMemo(() => {
    if (canUsePeerVoting) {
      return scoringCategoryOptions;
    }

    return scoringCategoryOptions.filter(
      (item) => item.value !== "PEER_VOTING",
    );
  }, [canUsePeerVoting]);

  const setSubmissionType = (value: string) => {
    setForm((previous) => {
      const next = { ...previous, submissionType: value };

      if (value !== "QR_CODE") {
        next.qrCodeValue = "";
      }

      if (value !== "TEXT") {
        next.textExpectedPhrase = "";
      }

      if (value !== "LOCATION" && value !== "IMAGE_LOCATION") {
        next.targetLatitude = "";
        next.targetLongitude = "";
      }

      const supportsPeerVoting = value === "IMAGE" || value === "VIDEO";
      if (!supportsPeerVoting && previous.scoringCategory === "PEER_VOTING") {
        next.scoringCategory = "SPEED";
        next.votingDurationValue = "";
        next.votingDurationUnit = "HOURS";
      }

      return next;
    });
  };

  const setScoringCategory = (value: string) => {
    setForm((previous) => {
      const next = { ...previous, scoringCategory: value };

      if (value === "UNLIMITED") {
        next.firstPlacePoints = "";
        next.secondPlacePoints = "";
        next.thirdPlacePoints = "";
      }

      if (value !== "PEER_VOTING") {
        next.votingDurationValue = "";
        next.votingDurationUnit = "HOURS";
      }

      return next;
    });
  };

  const setAutoApprove = (enabled: boolean) => {
    if (isAutoApproveForced) {
      updateField("autoApprove", true);
      return;
    }

    if (isAutoApproveDisabled) {
      updateField("autoApprove", false);
      return;
    }

    updateField("autoApprove", enabled);
  };

  const resetForm = (next?: Partial<ChallengeFormState>) => {
    setForm({
      ...defaultFormState,
      ...options.initialData,
      ...(next ?? {}),
    });
  };

  return {
    form,
    updateField,
    setSubmissionType,
    setScoringCategory,
    setAutoApprove,
    setStatus,
    resetForm,
    submissionTypeOptions,
    scoringOptions,
    statusOptions: isNewChallenge
      ? newChallengeStatusOptions
      : editChallengeStatusOptions,
    isPeerVoting,
    showPodiumPoints,
    isAutoApproveForced,
    isAutoApproveDisabled,
    needsLocation,
  };
}
