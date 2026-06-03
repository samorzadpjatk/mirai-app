import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  type ChallengeFormState,
  formatIso,
  formatTime,
  inferRecurringDaysFromWindow,
  newChallengeStatusOptions,
  scoringCategories,
  statusOptions,
  submissionTypes,
  toOptionalInt,
  toVotingDurationDraft,
  toVotingDurationHours,
} from "~/components/admin/challenges/challengeFormConstants";
import { useFileUpload } from "~/hooks/files";
import { getFileContentType, getFileExtension } from "~/utils/image";

interface ChallengeData {
  id?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  submissionType?: string | null;
  scoringCategory?: string | null;
  isRecurring?: boolean;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  votingStartTime?: string | Date | null;
  votingEndTime?: string | Date | null;
  basePoints?: number | null;
  firstPlacePoints?: number | null;
  secondPlacePoints?: number | null;
  thirdPlacePoints?: number | null;
  status?: string | null;
  targetLatitude?: number | null;
  targetLongitude?: number | null;
  qrCodeValue?: string | null;
  textExpectedPhrase?: string | null;
  autoApprove?: boolean;
}

type DateField = "startTime" | "endTime" | "dailyStartTime" | "dailyEndTime" | null;

interface UseChallengeFormProps {
  tripId: string;
  isNewChallenge?: boolean;
  initialData?: Partial<ChallengeFormState>;
  challengeId?: string;
}

export function useChallengeForm({
  tripId,
  isNewChallenge = false,
  initialData = {},
  challengeId,
}: UseChallengeFormProps) {
  const {
    upload,
    status: uploadStatus,
    progress: uploadProgress,
    error: uploadError,
  } = useFileUpload();

  const defaultForm: ChallengeFormState = {
    title: "",
    description: "",
    image: "",
    submissionType: "IMAGE",
    scoringCategory: "SPEED",
    isRecurring: false,
    dailyStartTime: null,
    dailyEndTime: null,
    recurringDays: "",
    basePoints: "",
    firstPlacePoints: "",
    secondPlacePoints: "",
    thirdPlacePoints: "",
    status: "HIDDEN",
    startTime: null,
    endTime: null,
    votingDurationValue: "",
    votingDurationUnit: "HOURS",
    targetLocation: null,
    qrCodeValue: "",
    textExpectedPhrase: "",
    autoApprove: false,
    ...initialData,
  };

  const [form, setForm] = useState<ChallengeFormState>(defaultForm);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<DateField>(null);
  const [activeSelect, setActiveSelect] = useState<
    "submissionType" | "scoringCategory" | "status" | null
  >(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [initialImage, setInitialImage] = useState<string | null>(null);

  // Derived state
  const isPeerVoting = form.scoringCategory === "PEER_VOTING";
  const canUsePeerVoting = form.submissionType === "IMAGE" || form.submissionType === "VIDEO";
  const showPodiumPoints = form.scoringCategory !== "UNLIMITED";
  const isAutoApproveForced =
    form.submissionType === "QR_CODE" || form.submissionType === "LOCATION";
  const isAutoApproveDisabled =
    form.submissionType === "IMAGE" ||
    form.submissionType === "VIDEO" ||
    form.submissionType === "IMAGE_LOCATION";
  const needsLocation =
    form.submissionType === "LOCATION" || form.submissionType === "IMAGE_LOCATION";
  const isUploadingImage = uploadStatus === "uploading";
  const imageUploadPercent =
    uploadProgress.percent != null ? Math.round(uploadProgress.percent * 100) : null;

  // Labels for selects
  const submissionTypeLabel = useMemo(
    () => submissionTypes.find((item) => item.value === form.submissionType)?.label ?? "Select",
    [form.submissionType],
  );

  const scoringCategoryLabel = useMemo(
    () => scoringCategories.find((item) => item.value === form.scoringCategory)?.label ?? "Select",
    [form.scoringCategory],
  );

  const statusLabel = useMemo(() => {
    const options = isNewChallenge ? newChallengeStatusOptions : statusOptions;
    return options.find((item) => item.value === form.status)?.label ?? "Select";
  }, [form.status, isNewChallenge]);

  const activeSelectOptions = useMemo(() => {
    if (activeSelect === "submissionType") return submissionTypes;
    if (activeSelect === "scoringCategory") {
      return canUsePeerVoting
        ? scoringCategories
        : scoringCategories.filter((item) => item.value !== "PEER_VOTING");
    }
    if (activeSelect === "status") {
      return isNewChallenge ? newChallengeStatusOptions : statusOptions;
    }
    return [];
  }, [activeSelect, canUsePeerVoting, isNewChallenge]);

  const updateForm = <K extends keyof ChallengeFormState>(field: K, value: ChallengeFormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleScoringChange = (value: string) => {
    if (
      value === "PEER_VOTING" &&
      form.submissionType !== "IMAGE" &&
      form.submissionType !== "VIDEO"
    ) {
      Alert.alert("Error", "Peer voting is available only for Image or Video challenges.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      scoringCategory: value,
      ...(value === "UNLIMITED"
        ? {
            firstPlacePoints: "",
            secondPlacePoints: "",
            thirdPlacePoints: "",
          }
        : {}),
      ...(value !== "PEER_VOTING"
        ? {
            votingDurationValue: "",
            votingDurationUnit: "HOURS",
          }
        : {}),
    }));
  };

  const handleSubmissionTypeChange = (value: string) => {
    setForm((prev) => {
      const shouldResetPeerVoting =
        prev.scoringCategory === "PEER_VOTING" && value !== "IMAGE" && value !== "VIDEO";

      return {
        ...prev,
        submissionType: value,
        ...(value !== "QR_CODE"
          ? {
              qrCodeValue: "",
            }
          : {}),
        ...(value !== "TEXT"
          ? {
              textExpectedPhrase: "",
            }
          : {}),
        ...(shouldResetPeerVoting
          ? {
              scoringCategory: "SPEED",
              votingDurationValue: "",
              votingDurationUnit: "HOURS",
            }
          : {}),
      };
    });
  };

  const openQrScanner = () => {
    setIsQrScannerOpen(true);
  };

  const handlePickImage = async () => {
    if (!tripId) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const extension = getFileExtension(asset);
      const storagePath = `challenge/${tripId}/cover-${Date.now()}.${extension}`;
      const contentType = asset.mimeType ?? getFileContentType(extension);
      const fileName = asset.fileName?.trim() ?? `challenge-cover-${Date.now()}.${extension}`;

      await upload({
        storagePath,
        fileUri: asset.uri,
        fileName,
        contentType,
        upsert: true,
      });

      setImagePreviewUri(asset.uri);
      updateForm("image", storagePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  const openDatePicker = (field: Exclude<DateField, null>) => {
    setActivePicker(field);
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert("Error", "Please fill in title and description");
      return false;
    }

    if (needsLocation) {
      if (!form.targetLocation) {
        Alert.alert("Error", "Please select a location on the map for location challenges");
        return false;
      }
    }

    if (form.submissionType === "QR_CODE" && !form.qrCodeValue.trim()) {
      Alert.alert("Error", "Scan or provide expected QR code value.");
      return false;
    }

    if (form.submissionType === "TEXT" && form.autoApprove && !form.textExpectedPhrase.trim()) {
      Alert.alert(
        "Error",
        "For text auto-approve, provide an expected phrase or disable auto-approve.",
      );
      return false;
    }

    if (form.isRecurring) {
      if (!form.dailyStartTime || !form.dailyEndTime) {
        Alert.alert("Error", "Provide daily start and end time");
        return false;
      }
      const recurringDays = toOptionalInt(form.recurringDays);
      if (!recurringDays || recurringDays < 1 || recurringDays > 30) {
        Alert.alert("Error", "Recurring days must be between 1 and 30");
        return false;
      }
    } else {
      if ((form.startTime && !form.endTime) || (!form.startTime && form.endTime)) {
        Alert.alert("Error", "Provide both start and end time");
        return false;
      }
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        Alert.alert("Error", "Start time must be before end time");
        return false;
      }
    }

    if (isPeerVoting) {
      const votingDurationHours = toVotingDurationHours(
        form.votingDurationValue,
        form.votingDurationUnit,
      );
      if (!votingDurationHours) {
        Alert.alert("Error", "Provide peer voting duration in hours or days (minimum 1).");
        return false;
      }
      if (!form.endTime) {
        Alert.alert("Error", "Peer voting challenge requires submission end time");
        return false;
      }
    }

    return true;
  };

  const initializeFormFromChallenge = (challenge: ChallengeData) => {
    const normalizedSubmissionType =
      challenge.submissionType === "MULTI_IMAGE" ? "IMAGE" : challenge.submissionType;
    const normalizedScoringCategory =
      (normalizedSubmissionType === "IMAGE" || normalizedSubmissionType === "VIDEO") &&
      challenge.scoringCategory === "PEER_VOTING"
        ? "PEER_VOTING"
        : challenge.scoringCategory === "PEER_VOTING"
          ? "SPEED"
          : challenge.scoringCategory;

    const expectedValue = challenge.qrCodeValue ?? "";
    const nextImage = challenge.image ?? "";
    const votingDurationDraft = toVotingDurationDraft(
      challenge.votingStartTime,
      challenge.votingEndTime,
    );

    const newFormState = {
      title: challenge.name ?? "",
      description: challenge.description ?? "",
      image: nextImage,
      submissionType: normalizedSubmissionType,
      scoringCategory: normalizedScoringCategory,
      isRecurring: challenge.isRecurring ?? false,
      dailyStartTime: challenge.dailyStartTime
        ? new Date(`1970-01-01T${challenge.dailyStartTime}:00`)
        : null,
      dailyEndTime: challenge.dailyEndTime
        ? new Date(`1970-01-01T${challenge.dailyEndTime}:00`)
        : null,
      recurringDays: challenge.isRecurring
        ? inferRecurringDaysFromWindow(challenge.startTime, challenge.endTime)
        : "",
      basePoints: challenge.basePoints != null ? String(challenge.basePoints) : "",
      firstPlacePoints:
        challenge.firstPlacePoints != null ? String(challenge.firstPlacePoints) : "",
      secondPlacePoints:
        challenge.secondPlacePoints != null ? String(challenge.secondPlacePoints) : "",
      thirdPlacePoints:
        challenge.thirdPlacePoints != null ? String(challenge.thirdPlacePoints) : "",
      status: challenge.status ?? "HIDDEN",
      startTime: challenge.startTime ? new Date(challenge.startTime) : null,
      endTime: challenge.endTime ? new Date(challenge.endTime) : null,
      votingDurationValue: votingDurationDraft.value,
      votingDurationUnit: votingDurationDraft.unit,
      targetLocation:
        challenge.targetLatitude && challenge.targetLongitude
          ? {
              latitude: challenge.targetLatitude,
              longitude: challenge.targetLongitude,
            }
          : null,
      qrCodeValue: expectedValue,
      textExpectedPhrase: challenge.textExpectedPhrase ?? "",
      autoApprove: challenge.autoApprove ?? false,
    } as ChallengeFormState;

    setForm(newFormState);
    setImagePreviewUri(nextImage ?? null);
    setInitialImage(nextImage);
    if (challengeId) {
      setInitializedChallengeId(challengeId);
    }
  };

  const [initializedChallengeId, setInitializedChallengeId] = useState<string | null>(null);

  return {
    // Form state
    form,
    imagePreviewUri,
    activePicker,
    activeSelect,
    showLocationPicker,
    isQrScannerOpen,
    initialImage,
    initializedChallengeId,
    uploadStatus,
    uploadProgress,
    uploadError,

    // Derived state
    isPeerVoting,
    canUsePeerVoting,
    showPodiumPoints,
    isAutoApproveForced,
    isAutoApproveDisabled,
    needsLocation,
    isUploadingImage,
    imageUploadPercent,
    submissionTypeLabel,
    scoringCategoryLabel,
    statusLabel,
    activeSelectOptions,

    // Actions
    updateForm,
    handleScoringChange,
    handleSubmissionTypeChange,
    openQrScanner,
    handlePickImage,
    openDatePicker,
    validateForm,
    initializeFormFromChallenge,
    setActivePicker,
    setActiveSelect,
    setShowLocationPicker,
    setIsQrScannerOpen,
    setImagePreviewUri,
    setInitializedChallengeId,

    // Utilities
    toOptionalInt,
    toVotingDurationHours,
    formatTime,
    formatIso,
  };
}
