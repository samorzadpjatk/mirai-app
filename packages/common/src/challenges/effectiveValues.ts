export interface EffectiveValuesInput {
  submissionType?: "IMAGE" | "VIDEO" | "TEXT" | "IMAGE_LOCATION" | "LOCATION" | "QR_CODE";
  qrCodeValue?: string;
  textExpectedPhrase?: string;
  autoApprove?: boolean;
}

export interface EffectiveValuesExisting {
  submissionType?: "IMAGE" | "VIDEO" | "TEXT" | "IMAGE_LOCATION" | "LOCATION" | "QR_CODE" | null;
  textExpectedPhrase?: string | null;
  qrCodeValue?: string | null;
  autoApprove?: boolean | null;
}

export interface EffectiveChallengeValues {
  effectiveSubmissionType: "IMAGE" | "VIDEO" | "TEXT" | "IMAGE_LOCATION" | "LOCATION" | "QR_CODE";
  effectiveExpectedValue: string | null;
  effectiveAutoApprove: boolean;
}

export const computeEffectiveChallengeValues = (
  input: EffectiveValuesInput,
  existing: EffectiveValuesExisting,
): EffectiveChallengeValues => {
  const effectiveSubmissionType = input.submissionType ?? existing.submissionType ?? "IMAGE";

  const effectiveExpectedValue =
    effectiveSubmissionType === "QR_CODE"
      ? (input.qrCodeValue ?? existing.qrCodeValue ?? null)
      : effectiveSubmissionType === "TEXT"
        ? (input.textExpectedPhrase ?? existing.textExpectedPhrase ?? null)
        : null;

  const effectiveAutoApprove =
    effectiveSubmissionType === "QR_CODE" || effectiveSubmissionType === "LOCATION"
      ? true
      : effectiveSubmissionType === "IMAGE_LOCATION"
        ? false
        : (input.autoApprove ?? existing.autoApprove ?? false);

  return {
    effectiveSubmissionType,
    effectiveExpectedValue,
    effectiveAutoApprove,
  };
};
