import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useFileUpload } from "~/hooks/files";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { LocationPicker, type LocationCoordinate } from "../../../../components/map/LocationPicker";
import { Ionicons } from "@expo/vector-icons";

const submissionTypes = [
  { label: "Image", value: "IMAGE" },
  { label: "Video", value: "VIDEO" },
  { label: "Text", value: "TEXT" },
  { label: "Image + Location", value: "IMAGE_LOCATION" },
  { label: "Location", value: "LOCATION" },
  { label: "QR Code", value: "QR_CODE" },
] as const;

const scoringCategories = [
  { label: "Speed", value: "SPEED" },
  { label: "Unlimited", value: "UNLIMITED" },
  { label: "Judged (Staff)", value: "JUDGED_STAFF" },
  { label: "Peer Voting", value: "PEER_VOTING" },
] as const;

const statusOptions = [
  { label: "Hidden", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
] as const;

type DateField =
  | "startTime"
  | "endTime"
  | "votingStartTime"
  | "votingEndTime"
  | "dailyStartTime"
  | "dailyEndTime"
  | null;

const formatTime = (date: Date | null) => {
  if (!date) return "";
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatIso = (date: Date | null) => (date ? date.toISOString() : "");

const getImageExtension = (asset: ImagePicker.ImagePickerAsset) => {
  if (asset.fileName) {
    const parts = asset.fileName.split(".");
    if (parts.length > 1) {
      return parts[parts.length - 1]?.toLowerCase() ?? "jpg";
    }
  }

  const contentType = asset.mimeType ?? "";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic" || contentType === "image/heif") {
    return "heic";
  }
  return "jpg";
};

const getImageContentType = (extension: string) => {
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
};

export default function NewChallengeScreen() {
  const params = useLocalSearchParams();
  const trpc = useTRPC();
  const { upload, status: uploadStatus, progress: uploadProgress } = useFileUpload();
  const insets = useAppSafeAreaInsets();

  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0] ?? "";

  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    submissionType: "IMAGE",
    scoringCategory: "SPEED",
    isRecurring: false,
    dailyStartTime: null as Date | null,
    dailyEndTime: null as Date | null,
    basePoints: "",
    firstPlacePoints: "",
    secondPlacePoints: "",
    thirdPlacePoints: "",
    status: "HIDDEN",
    startTime: null as Date | null,
    endTime: null as Date | null,
    votingStartTime: null as Date | null,
    votingEndTime: null as Date | null,
    targetLocation: null as LocationCoordinate | null,
    qrCodeValue: "",
    autoApprove: false,
  });
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<DateField>(null);
  const [activeSelect, setActiveSelect] = useState<
    "submissionType" | "scoringCategory" | "status" | null
  >(null);
  const [pickerDraftDate, setPickerDraftDate] = useState<Date>(new Date());
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [hasScannedQrThisSession, setHasScannedQrThisSession] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const toOptionalInt = (value: string) => {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const toOptionalFloat = (value: string) => {
    if (!value) return undefined;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const createChallengeMutation = useMutation(
    trpc.challenge.create.mutationOptions({
      onSuccess: () => {
        Alert.alert("Saved", "Challenge created successfully.");
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to create challenge: ${error.message}`);
      },
    }),
  );

  const isPeerVoting = form.scoringCategory === "PEER_VOTING";
  const canUsePeerVoting =
    form.submissionType === "IMAGE" || form.submissionType === "VIDEO";
  const showPodiumPoints = form.scoringCategory !== "UNLIMITED";
  const isAutoApproveForced =
    form.submissionType === "QR_CODE" || form.submissionType === "LOCATION";
  const needsLocation =
    form.submissionType === "LOCATION" || form.submissionType === "IMAGE_LOCATION";
  const isUploadingImage = uploadStatus === "uploading";
  const imageUploadPercent =
    uploadProgress.percent != null
      ? Math.round(uploadProgress.percent * 100)
      : null;

  const submissionTypeLabel = useMemo(
    () =>
      submissionTypes.find((item) => item.value === form.submissionType)?.label ??
      "Select",
    [form.submissionType],
  );

  const scoringCategoryLabel = useMemo(
    () =>
      scoringCategories.find((item) => item.value === form.scoringCategory)?.label ??
      "Select",
    [form.scoringCategory],
  );

  const statusLabel = useMemo(
    () => statusOptions.find((item) => item.value === form.status)?.label ?? "Select",
    [form.status],
  );

  const activeSelectOptions = useMemo(() => {
    if (activeSelect === "submissionType") return submissionTypes;
    if (activeSelect === "scoringCategory") {
      return canUsePeerVoting
        ? scoringCategories
        : scoringCategories.filter((item) => item.value !== "PEER_VOTING");
    }
    if (activeSelect === "status") return statusOptions;
    return [];
  }, [activeSelect, canUsePeerVoting]);

  const updateForm = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
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
          votingStartTime: null,
          votingEndTime: null,
        }
        : {}),
    }));
  };

  const handleSubmissionTypeChange = (value: string) => {
    setForm((prev) => {
      const shouldResetPeerVoting =
        prev.scoringCategory === "PEER_VOTING" &&
        value !== "IMAGE" &&
        value !== "VIDEO";

      return {
        ...prev,
        submissionType: value,
        ...(value !== "QR_CODE"
          ? {
            qrCodeValue: "",
          }
          : {}),
        ...(shouldResetPeerVoting
          ? {
            scoringCategory: "SPEED",
            votingStartTime: null,
            votingEndTime: null,
          }
          : {}),
      };
    });
  };

  const openQrScanner = async () => {
    const permission =
      cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();
    if (!permission?.granted) {
      Alert.alert("Permission required", "Camera permission is needed to scan QR code.");
      return;
    }
    setHasScannedQrThisSession(false);
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
      const extension = getImageExtension(asset);
      const storagePath = `challenge/${tripId}/cover-${Date.now()}.${extension}`;
      const contentType = asset.mimeType ?? getImageContentType(extension);
      const fileName =
        asset.fileName?.trim() ||
        `challenge-cover-${Date.now()}.${extension}`;

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
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      Alert.alert("Upload error", message);
    }
  };

  const handleDateChange =
    (field: Exclude<DateField, null>) =>
      (event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS === "android") {
          if (event.type === "dismissed") {
            setActivePicker(null);
            return;
          }
          if (selected) {
            updateForm(field, selected);
          }
          setActivePicker(null);
          return;
        }

        if (selected) {
          setPickerDraftDate(selected);
        }
      };

  const openDatePicker = (field: Exclude<DateField, null>) => {
    setPickerDraftDate(form[field] ?? new Date());
    setActivePicker(field);
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert("Error", "Please fill in title and description");
      return false;
    }

    if (needsLocation) {
      if (!form.targetLocation) {
        Alert.alert(
          "Error",
          "Please select a location on the map for location challenges",
        );
        return false;
      }
    }

    if (form.submissionType === "QR_CODE" && !form.qrCodeValue.trim()) {
      Alert.alert("Error", "Scan or provide expected QR code value.");
      return false;
    }

    if (form.isRecurring) {
      if (!form.dailyStartTime || !form.dailyEndTime) {
        Alert.alert("Error", "Provide daily start and end time");
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
      if (
        (form.votingStartTime && !form.votingEndTime) ||
        (!form.votingStartTime && form.votingEndTime)
      ) {
        Alert.alert("Error", "Provide both voting start and end time");
        return false;
      }
      if (form.votingStartTime && form.votingEndTime && form.votingStartTime >= form.votingEndTime) {
        Alert.alert("Error", "Voting start must be before voting end");
        return false;
      }
      if (!form.endTime) {
        Alert.alert("Error", "Peer voting challenge requires submission end time");
        return false;
      }
      if (form.votingStartTime && form.votingStartTime <= form.endTime) {
        Alert.alert("Error", "Voting must start after submission end time");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!tripId) {
      Alert.alert("Error", "No trip selected");
      return;
    }

    if (isUploadingImage) {
      Alert.alert("Please wait", "Image upload is still in progress.");
      return;
    }

    const normalizedTargetLatitude = needsLocation
      ? form.targetLocation?.latitude
      : undefined;
    const normalizedTargetLongitude = needsLocation
      ? form.targetLocation?.longitude
      : undefined;

    if (
      needsLocation &&
      (normalizedTargetLatitude == null || normalizedTargetLongitude == null)
    ) {
      Alert.alert("Error", "Please select a valid location on the map.");
      return;
    }

    try {
      await createChallengeMutation.mutateAsync({
        tripId,
        name: form.title.trim(),
        description: form.description.trim() || undefined,
        image: form.image || undefined,
        submissionType: form.submissionType as
          | "IMAGE"
          | "VIDEO"
          | "TEXT"
          | "IMAGE_LOCATION"
          | "LOCATION"
          | "QR_CODE",
        scoringCategory: form.scoringCategory as
          | "SPEED"
          | "UNLIMITED"
          | "JUDGED_STAFF"
          | "PEER_VOTING",
        isRecurring: form.isRecurring,
        dailyStartTime: form.isRecurring
          ? formatTime(form.dailyStartTime) || undefined
          : undefined,
        dailyEndTime: form.isRecurring
          ? formatTime(form.dailyEndTime) || undefined
          : undefined,
        basePoints: toOptionalInt(form.basePoints),
        firstPlacePoints: showPodiumPoints
          ? toOptionalInt(form.firstPlacePoints)
          : undefined,
        secondPlacePoints: showPodiumPoints
          ? toOptionalInt(form.secondPlacePoints)
          : undefined,
        thirdPlacePoints: showPodiumPoints
          ? toOptionalInt(form.thirdPlacePoints)
          : undefined,
        status: form.status as "HIDDEN" | "VISIBLE",
        startTime: !form.isRecurring ? formatIso(form.startTime) || undefined : undefined,
        endTime: !form.isRecurring ? formatIso(form.endTime) || undefined : undefined,
        votingStartTime: isPeerVoting
          ? formatIso(form.votingStartTime) || undefined
          : undefined,
        votingEndTime: isPeerVoting ? formatIso(form.votingEndTime) || undefined : undefined,
        targetLatitude: normalizedTargetLatitude,
        targetLongitude: normalizedTargetLongitude,
        qrCodeValue:
          form.submissionType === "QR_CODE"
            ? form.qrCodeValue.trim() || undefined
            : undefined,
        autoApprove: isAutoApproveForced ? true : form.autoApprove,
      });
    } catch {
      // onError already handles user-facing message; swallow to prevent unhandled rejections.
    }
  };

  if (!tripId) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingText}>Missing trip context.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxxl + spacing.xl },
        ]}
      >
        <Text style={styles.pageTitle}>New Challenge</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basics</Text>

          <Text style={styles.label}>Challenge Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Campus Marathon"
            placeholderTextColor={colors.textTertiary}
            value={form.title}
            onChangeText={(value) => updateForm("title", value)}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the goal of this challenge..."
            placeholderTextColor={colors.textTertiary}
            value={form.description}
            onChangeText={(value) => updateForm("description", value)}
            multiline
          />

          <Text style={styles.label}>Challenge Image</Text>
          {imagePreviewUri ? (
            <Image source={{ uri: imagePreviewUri }} style={styles.coverPreview} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>No image selected</Text>
            </View>
          )}
          <View style={styles.rowButtons}>
            <TouchableOpacity
              onPress={() => void handlePickImage()}
              style={styles.secondaryButton}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.secondaryButtonText}>Upload Image</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setImagePreviewUri(null);
                updateForm("image", "");
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {isUploadingImage && (
            <Text style={styles.hint}>
              Uploading image
              {imageUploadPercent != null ? ` ${imageUploadPercent}%` : "..."}
            </Text>
          )}

          <Text style={styles.label}>Submission Type</Text>
          <TouchableOpacity
            onPress={() => setActiveSelect("submissionType")}
            style={styles.selectButton}
          >
            <Text style={styles.selectButtonText}>{submissionTypeLabel}</Text>
            <Text style={styles.selectButtonChevron}>▾</Text>
          </TouchableOpacity>

          {form.submissionType === "QR_CODE" ? (
            <>
              <Text style={styles.label}>Expected QR code value</Text>
              <TextInput
                style={styles.input}
                placeholder="Scan QR code or type expected value"
                placeholderTextColor={colors.textTertiary}
                value={form.qrCodeValue}
                onChangeText={(value) => updateForm("qrCodeValue", value)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.rowButtons}>
                <TouchableOpacity onPress={openQrScanner} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Scan QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateForm("qrCodeValue", "")}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {needsLocation ? (
            <>
              <Text style={styles.label}>Target Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(true)}
                style={styles.locationCard}
              >
                <View style={styles.locationContent}>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationText}>
                      {form.targetLocation
                        ? `Selected: ${form.targetLocation.latitude.toFixed(5)}, ${form.targetLocation.longitude.toFixed(5)}`
                        : "Tap to select location on map"
                      }
                    </Text>
                    <Text style={styles.hint}>
                      Tap to open map and select the exact location
                    </Text>
                  </View>
                  <View style={styles.locationIcon}>
                    <Ionicons
                      name="location-sharp"
                      size={20}
                      color={colors.white}
                      style={styles.mapControlButtonIcon}
                    />
                  </View>
                </View>
              </TouchableOpacity>
              {form.targetLocation && (
                <TouchableOpacity
                  onPress={() => updateForm("targetLocation", null)}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear Location</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoring</Text>

          <Text style={styles.label}>Scoring Category</Text>
          <TouchableOpacity
            onPress={() => setActiveSelect("scoringCategory")}
            style={styles.selectButton}
          >
            <Text style={styles.selectButtonText}>{scoringCategoryLabel}</Text>
            <Text style={styles.selectButtonChevron}>▾</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Base Points</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={form.basePoints}
            onChangeText={(value) => updateForm("basePoints", value)}
            keyboardType="numeric"
          />

          {showPodiumPoints && (
            <>
              <Text style={styles.label}>Podium Points (optional)</Text>
              <View style={styles.inlineInputs}>
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  placeholder="1st"
                  placeholderTextColor={colors.textTertiary}
                  value={form.firstPlacePoints}
                  onChangeText={(value) => updateForm("firstPlacePoints", value)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  placeholder="2nd"
                  placeholderTextColor={colors.textTertiary}
                  value={form.secondPlacePoints}
                  onChangeText={(value) => updateForm("secondPlacePoints", value)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  placeholder="3rd"
                  placeholderTextColor={colors.textTertiary}
                  value={form.thirdPlacePoints}
                  onChangeText={(value) => updateForm("thirdPlacePoints", value)}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.switchRow}>
            <Text style={styles.labelInline}>Recurring (daily)</Text>
            <Switch
              value={form.isRecurring}
              onValueChange={(value) => updateForm("isRecurring", value)}
              trackColor={{ false: colors.borderDark, true: colors.primaryOpacity80 }}
              thumbColor={form.isRecurring ? colors.primary : colors.textSecondary}
            />
          </View>

          {form.isRecurring ? (
            <>
              <Text style={styles.label}>Daily Time Window</Text>
              <View style={styles.inlineButtons}>
                <TouchableOpacity
                  onPress={() => openDatePicker("dailyStartTime")}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateText}>
                    {form.dailyStartTime ? formatTime(form.dailyStartTime) : "Start"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openDatePicker("dailyEndTime")}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateText}>
                    {form.dailyEndTime ? formatTime(form.dailyEndTime) : "End"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Submission Window</Text>
              <View style={styles.inlineButtons}>
                <TouchableOpacity
                  onPress={() => openDatePicker("startTime")}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateText}>
                    {form.startTime ? form.startTime.toLocaleString() : "Start"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openDatePicker("endTime")}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateText}>
                    {form.endTime ? form.endTime.toLocaleString() : "End"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {isPeerVoting && (
            <>
              <Text style={styles.label}>Voting Window</Text>
              <View style={styles.inlineButtons}>
                <TouchableOpacity
                  onPress={() => openDatePicker("votingStartTime")}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateText}>
                    {form.votingStartTime
                      ? form.votingStartTime.toLocaleString()
                      : "Voting start"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openDatePicker("votingEndTime")}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateText}>
                    {form.votingEndTime
                      ? form.votingEndTime.toLocaleString()
                      : "Voting end"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>

          <Text style={styles.label}>Status</Text>
          <TouchableOpacity
            onPress={() => setActiveSelect("status")}
            style={styles.selectButton}
          >
            <Text style={styles.selectButtonText}>{statusLabel}</Text>
            <Text style={styles.selectButtonChevron}>▾</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>{statusLabel}</Text>

          <View style={styles.switchRow}>
            <Text style={styles.labelInline}>Auto-approve submissions</Text>
            <Switch
              value={isAutoApproveForced ? true : form.autoApprove}
              onValueChange={(value) => updateForm("autoApprove", value)}
              disabled={isAutoApproveForced}
              trackColor={{ false: colors.borderDark, true: colors.primaryOpacity80 }}
              thumbColor={(isAutoApproveForced || form.autoApprove) ? colors.primary : colors.textSecondary}
            />
          </View>
          {isAutoApproveForced ? (
            <Text style={styles.hint}>
              Auto-approve is always enabled for QR code and Location challenges.
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          disabled={createChallengeMutation.isPending || isUploadingImage}
        >
          <Text style={styles.saveButtonText}>
            {createChallengeMutation.isPending ? "Saving..." : "Save Challenge"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {activePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={form[activePicker] ?? new Date()}
          mode={
            activePicker === "dailyStartTime" || activePicker === "dailyEndTime"
              ? "time"
              : "datetime"
          }
          display="default"
          onChange={handleDateChange(activePicker)}
        />
      )}

      <Modal
        visible={Boolean(activePicker) && Platform.OS === "ios"}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <Pressable
          style={styles.datePickerBackdrop}
          onPress={() => setActivePicker(null)}
        >
          <Pressable style={styles.datePickerCard}>
            {activePicker ? (
              <DateTimePicker
                value={pickerDraftDate}
                mode={
                  activePicker === "dailyStartTime" ||
                    activePicker === "dailyEndTime"
                    ? "time"
                    : "datetime"
                }
                display="spinner"
                onChange={handleDateChange(activePicker)}
              />
            ) : null}
            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerActionButton}
                onPress={() => setActivePicker(null)}
              >
                <Text style={styles.datePickerActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.datePickerActionButton,
                  styles.datePickerActionButtonPrimary,
                ]}
                onPress={() => {
                  if (activePicker) {
                    updateForm(activePicker, pickerDraftDate);
                  }
                  setActivePicker(null);
                }}
              >
                <Text
                  style={[
                    styles.datePickerActionText,
                    styles.datePickerActionTextPrimary,
                  ]}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isQrScannerOpen}
        animationType="slide"
        onRequestClose={() => setIsQrScannerOpen(false)}
      >
        <View style={styles.locationModalContainer}>
          <View
            style={[
              styles.locationModalHeader,
              { paddingTop: Math.max(insets.top + spacing.sm, spacing.xl) },
            ]}
          >
            <Text style={styles.locationModalTitle}>Scan expected QR code</Text>
            <TouchableOpacity
              onPress={() => setIsQrScannerOpen(false)}
              style={styles.locationHeaderButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.locationHeaderButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.locationMapContainer}>
            <CameraView
              style={styles.locationMap}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={(event) => {
                if (hasScannedQrThisSession) return;
                setHasScannedQrThisSession(true);
                updateForm("qrCodeValue", event.data ?? "");
                setIsQrScannerOpen(false);
              }}
            />
          </View>
          <View style={styles.locationFooter}>
            <Text style={styles.locationFooterText}>
              Point camera at QR code to set expected value.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeSelect != null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveSelect(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setActiveSelect(null)}>
          <Pressable style={styles.modalCard}>
            {activeSelectOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  if (activeSelect === "submissionType") {
                    handleSubmissionTypeChange(option.value);
                  } else if (activeSelect === "scoringCategory") {
                    handleScoringChange(option.value);
                  } else if (activeSelect === "status") {
                    updateForm("status", option.value);
                  }
                  setActiveSelect(null);
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        initialLocation={form.targetLocation}
        onLocationSelected={(location) => {
          updateForm("targetLocation", location);
          setShowLocationPicker(false);
        }}
        onClose={() => setShowLocationPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapControlButtonIcon: {
    fontSize: 20,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  pageTitle: {
    color: colors.white,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    marginBottom: spacing.xs,
  },
  section: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.xs,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: spacing.xs,
  },
  labelInline: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  input: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.white,
    fontSize: typography.base,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  selectButton: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  selectButtonChevron: {
    color: colors.textSecondary,
    fontSize: typography.base,
  },
  hint: {
    color: colors.textTertiary,
    fontSize: typography.xs,
  },
  coverPreview: {
    width: "100%",
    height: 160,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceDark,
  },
  coverPlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceDark,
  },
  coverPlaceholderText: {
    color: colors.textTertiary,
    fontSize: typography.sm,
  },
  rowButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.primaryOpacity20,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.white,
    fontWeight: typography.bold,
    fontSize: typography.sm,
  },
  clearButton: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  inlineInputs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inlineInput: {
    flex: 1,
  },
  inlineButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  dateText: {
    color: colors.white,
    fontSize: typography.sm,
  },
  switchRow: {
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  saveButtonText: {
    color: colors.backgroundDark,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  missingContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  missingText: {
    color: colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.blackOpacity40,
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    overflow: "hidden",
  },
  modalOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWhite5,
  },
  modalOptionText: {
    color: colors.white,
    fontSize: typography.base,
  },
  datePickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  datePickerCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    overflow: "hidden",
  },
  datePickerActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.borderWhite10,
  },
  datePickerActionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerActionButtonPrimary: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderWhite10,
    backgroundColor: "rgba(0,206,209,0.08)",
  },
  datePickerActionText: {
    color: colors.textSecondary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  datePickerActionTextPrimary: {
    color: colors.primary,
  },
  locationCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    gap: spacing.sm,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationInfo: {
    flex: 1,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,206,209,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationIconText: {
    fontSize: 20,
  },
  locationText: {
    color: colors.white,
    fontSize: typography.sm,
  },
  locationModalContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundDark,
    zIndex: 50,
    elevation: 50,
  },
  locationModalHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWhite10,
    backgroundColor: colors.backgroundDark,
    zIndex: 3,
    elevation: 3,
  },
  locationModalTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  locationHeaderButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  locationHeaderButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  locationMapContainer: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  locationMap: {
    ...StyleSheet.absoluteFillObject,
  },
  locationFooter: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderWhite10,
    backgroundColor: colors.cardDark,
  },
  locationFooterText: {
    color: colors.textPrimary,
    fontSize: typography.sm,
  },
});
