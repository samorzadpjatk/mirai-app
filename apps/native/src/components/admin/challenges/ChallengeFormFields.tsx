import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField } from "~/components/common/ui/FormField";
import { ThemedTextInput } from "~/components/common/ui/ThemedTextInput";
import type { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import { borderRadius, colors, spacing, typography } from "~/styles";

export function formatLocationText(
  targetLocation: { latitude: number; longitude: number } | null,
): string {
  if (!targetLocation) return "Tap to select location on map";
  return `Selected: ${targetLocation.latitude.toFixed(5)}, ${targetLocation.longitude.toFixed(5)}`;
}

export function getAutoApproveSwitchValue(
  isAutoApproveForced: boolean,
  isAutoApproveDisabled: boolean,
  autoApprove: boolean,
): boolean {
  if (isAutoApproveForced) return true;
  if (isAutoApproveDisabled) return false;
  return autoApprove;
}

export function getAutoApproveThumbColor(
  isAutoApproveForced: boolean,
  isAutoApproveDisabled: boolean,
  autoApprove: boolean,
  primaryColor: string,
  textSecondaryColor: string,
): string {
  if ((isAutoApproveForced || autoApprove) && !isAutoApproveDisabled) return primaryColor;
  return textSecondaryColor;
}

interface ChallengeFormFieldsProps {
  formState: ReturnType<typeof useChallengeForm>;
  onSave: () => void;
  saveButtonText: string;
  isSaving: boolean;
  isNewChallenge?: boolean;
}

export function ChallengeFormFields({
  formState,
  onSave,
  saveButtonText,
  isSaving,
  isNewChallenge = false,
}: ChallengeFormFieldsProps) {
  const {
    form,
    imagePreviewUri,
    isPeerVoting,
    showPodiumPoints,
    isAutoApproveForced,
    isAutoApproveDisabled,
    needsLocation,
    isUploadingImage,
    imageUploadPercent,
    submissionTypeLabel,
    scoringCategoryLabel,
    statusLabel,
    updateForm,
    handlePickImage,
    openDatePicker,
    setActiveSelect,
    setShowLocationPicker,
    formatTime,
  } = formState;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xxxl + spacing.xl }]}
    >
      <Text style={styles.pageTitle}>{isNewChallenge ? "New Challenge" : "Edit Challenge"}</Text>

      {/* Basics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basics</Text>

        <FormField label="Challenge Title" required={true}>
          <ThemedTextInput
            placeholder="e.g. Campus Marathon"
            value={form.title}
            onChangeText={(value) => updateForm("title", value)}
          />
        </FormField>

        <FormField label="Description" required={true}>
          <ThemedTextInput
            style={styles.textArea}
            placeholder="Describe the goal of this challenge..."
            value={form.description}
            onChangeText={(value) => updateForm("description", value)}
            multiline={true}
          />
        </FormField>

        <FormField label="Challenge Image">
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
                formState.setImagePreviewUri("");
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
        </FormField>

        <FormField label="Submission Type">
          <TouchableOpacity
            onPress={() => setActiveSelect("submissionType")}
            style={styles.selectButton}
          >
            <Text style={styles.selectButtonText}>{submissionTypeLabel}</Text>
            <Text style={styles.selectButtonChevron}>▾</Text>
          </TouchableOpacity>
        </FormField>

        {form.submissionType === "QR_CODE" && (
          <FormField label="Expected QR code value">
            <ThemedTextInput
              placeholder="Scan QR code or type expected value"
              value={form.qrCodeValue}
              onChangeText={(value) => updateForm("qrCodeValue", value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.rowButtons}>
              <TouchableOpacity onPress={formState.openQrScanner} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Scan QR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateForm("qrCodeValue", "")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </FormField>
        )}

        {form.submissionType === "TEXT" && (
          <FormField label="Expected phrase (optional)">
            <ThemedTextInput
              placeholder="Leave empty to not auto-approve by phrase"
              value={form.textExpectedPhrase}
              onChangeText={(value) => updateForm("textExpectedPhrase", value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              If set, submission will be auto-approved only when the user types this exact phrase.
            </Text>
          </FormField>
        )}

        {needsLocation && (
          <FormField label="Target Location">
            <TouchableOpacity
              onPress={() => setShowLocationPicker(true)}
              style={styles.locationCard}
            >
              <View style={styles.locationContent}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>{formatLocationText(form.targetLocation)}</Text>
                  <Text style={styles.hint}>Tap to open map and select the exact location</Text>
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
          </FormField>
        )}
      </View>

      {/* Scoring Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scoring</Text>

        <FormField label="Scoring Category">
          <TouchableOpacity
            onPress={() => setActiveSelect("scoringCategory")}
            style={styles.selectButton}
          >
            <Text style={styles.selectButtonText}>{scoringCategoryLabel}</Text>
            <Text style={styles.selectButtonChevron}>▾</Text>
          </TouchableOpacity>
        </FormField>

        <FormField label="Base Points">
          <ThemedTextInput
            placeholder="0"
            value={form.basePoints}
            onChangeText={(value) => updateForm("basePoints", value)}
            keyboardType="numeric"
          />
        </FormField>

        {showPodiumPoints && (
          <FormField label="Podium Points (optional)">
            <View style={styles.inlineInputs}>
              <ThemedTextInput
                style={styles.inlineInput}
                placeholder="1st"
                value={form.firstPlacePoints}
                onChangeText={(value) => updateForm("firstPlacePoints", value)}
                keyboardType="numeric"
              />
              <ThemedTextInput
                style={styles.inlineInput}
                placeholder="2nd"
                value={form.secondPlacePoints}
                onChangeText={(value) => updateForm("secondPlacePoints", value)}
                keyboardType="numeric"
              />
              <ThemedTextInput
                style={styles.inlineInput}
                placeholder="3rd"
                value={form.thirdPlacePoints}
                onChangeText={(value) => updateForm("thirdPlacePoints", value)}
                keyboardType="numeric"
              />
            </View>
          </FormField>
        )}
      </View>

      {/* Schedule Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>

        <View style={styles.switchRow}>
          <Text style={styles.labelInline}>Recurring (daily)</Text>
          <Switch
            value={form.isRecurring}
            onValueChange={(value) => updateForm("isRecurring", value)}
            trackColor={{
              false: colors.borderDark,
              true: colors.primaryOpacity80,
            }}
            thumbColor={form.isRecurring ? colors.primary : colors.textSecondary}
          />
        </View>

        {form.isRecurring ? (
          <>
            <FormField label="Daily Time Window">
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
            </FormField>

            <FormField label="Recurring Days">
              <ThemedTextInput
                placeholder="e.g. 7"
                value={form.recurringDays}
                onChangeText={(value) => updateForm("recurringDays", value)}
                keyboardType="numeric"
              />
            </FormField>
          </>
        ) : (
          <FormField label="Submission Window">
            <View style={styles.inlineButtons}>
              <TouchableOpacity
                onPress={() => openDatePicker("startTime")}
                style={styles.dateButton}
              >
                <Text style={styles.dateText}>
                  {form.startTime ? form.startTime.toLocaleString() : "Start"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openDatePicker("endTime")} style={styles.dateButton}>
                <Text style={styles.dateText}>
                  {form.endTime ? form.endTime.toLocaleString() : "End"}
                </Text>
              </TouchableOpacity>
            </View>
          </FormField>
        )}

        {isPeerVoting && (
          <FormField label="Voting Duration">
            <View style={styles.inlineInputs}>
              <ThemedTextInput
                style={styles.inlineInput}
                placeholder="e.g. 24"
                value={form.votingDurationValue}
                onChangeText={(value) => updateForm("votingDurationValue", value)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={() => updateForm("votingDurationUnit", "HOURS")}
                style={[
                  styles.dateButton,
                  form.votingDurationUnit === "HOURS" && styles.selectOptionActive,
                ]}
              >
                <Text style={styles.dateText}>Hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateForm("votingDurationUnit", "DAYS")}
                style={[
                  styles.dateButton,
                  form.votingDurationUnit === "DAYS" && styles.selectOptionActive,
                ]}
              >
                <Text style={styles.dateText}>Days</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Voting starts automatically after all submissions are reviewed.
            </Text>
          </FormField>
        )}
      </View>

      {/* Advanced Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced</Text>

        <FormField label="Status">
          <TouchableOpacity onPress={() => setActiveSelect("status")} style={styles.selectButton}>
            <Text style={styles.selectButtonText}>{statusLabel}</Text>
            <Text style={styles.selectButtonChevron}>▾</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>{statusLabel}</Text>
        </FormField>

        <View style={styles.switchRow}>
          <Text style={styles.labelInline}>Auto-approve submissions</Text>
          <Switch
            value={getAutoApproveSwitchValue(
              isAutoApproveForced,
              isAutoApproveDisabled,
              form.autoApprove,
            )}
            onValueChange={(value) => updateForm("autoApprove", value)}
            disabled={isAutoApproveForced || isAutoApproveDisabled}
            trackColor={{
              false: colors.borderDark,
              true: colors.primaryOpacity80,
            }}
            thumbColor={getAutoApproveThumbColor(
              isAutoApproveForced,
              isAutoApproveDisabled,
              form.autoApprove,
              colors.primary,
              colors.textSecondary,
            )}
          />
        </View>
        {isAutoApproveForced ? (
          <Text style={styles.hint}>
            Auto-approve is always enabled for QR code and Location challenges.
          </Text>
        ) : isAutoApproveDisabled ? (
          <Text style={styles.hint}>
            Auto-approve is not available for Image, Video and Image + Location challenges.
          </Text>
        ) : null}
      </View>

      <PrimaryLoadingButton
        label={isSaving ? "Saving..." : saveButtonText}
        onPress={onSave}
        isLoading={isSaving}
        disabled={isUploadingImage}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mapControlButtonIcon: {
    fontSize: 20,
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
  labelInline: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
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
    marginTop: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  clearButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    alignItems: "center",
  },
  clearButtonText: {
    color: colors.textTertiary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  locationCard: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  locationIcon: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  inlineInputs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inlineInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  inlineButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateButton: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    alignItems: "center",
  },
  dateText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  selectOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
