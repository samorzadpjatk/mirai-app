import { Modal, Pressable, StyleSheet, Text, TouchableOpacity } from "react-native";
import { QrScannerModal } from "~/components/common/QrScannerModal";
import { DateTimePickerModal } from "~/components/common/ui/DateTimePickerModal";
import { LocationPicker } from "~/components/map/LocationPicker";
import type { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface ChallengeFormModalsProps {
  formState: ReturnType<typeof useChallengeForm>;
}

export function ChallengeFormModals({ formState }: ChallengeFormModalsProps) {
  const {
    form,
    activePicker,
    activeSelect,
    showLocationPicker,
    isQrScannerOpen,
    activeSelectOptions,
    updateForm,
    handleSubmissionTypeChange,
    handleScoringChange,
    setActivePicker,
    setActiveSelect,
    setShowLocationPicker,
    setIsQrScannerOpen,
  } = formState;

  return (
    <>
      {/* Date/Time Picker Modal */}
      <DateTimePickerModal
        visible={Boolean(activePicker)}
        value={activePicker ? (form[activePicker] ?? new Date()) : new Date()}
        mode={
          activePicker === "dailyStartTime" || activePicker === "dailyEndTime" ? "time" : "datetime"
        }
        onConfirm={(date) => {
          if (activePicker) {
            updateForm(activePicker, date);
          }
          setActivePicker(null);
        }}
        onCancel={() => setActivePicker(null)}
      />

      {/* QR Scanner Modal */}
      <QrScannerModal
        visible={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        title="Scan expected QR code"
        instructionText="Point camera at QR code to set expected value."
        onScan={(data) => updateForm("qrCodeValue", data)}
      />

      {/* Option Picker Modal */}
      <Modal
        visible={activeSelect != null}
        transparent={true}
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
    </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.blackOpacity40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    width: "100%",
    maxWidth: 400,
    paddingVertical: spacing.sm,
  },
  modalOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  modalOptionText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
});
