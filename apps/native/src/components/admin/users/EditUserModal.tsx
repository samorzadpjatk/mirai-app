import { formatDisplayName } from "@mirai-app/common/users";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DateTimePickerModal, FormField, ThemedTextInput } from "~/components/common/ui";
import type { User } from "~/hooks/admin/useAdminUsers";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import { formatBanLabel, isBanReady, isNameValid } from "~/utils/validation";
import { AdminModal, AdminModalButton } from "../AdminModal";

interface EditUserModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (
    userId: string,
    firstName: string,
    lastName: string,
    wristNumber: string,
    houseNumber: string,
  ) => void;
  onDelete: (userId: string) => void;
  onBan: (userId: string, bannedUntilMs: number, reason: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  isBanning: boolean;
}

export function EditUserModal({
  visible,
  user,
  onClose,
  onSave,
  onDelete,
  onBan,
  isSaving,
  isDeleting,
  isBanning,
}: EditUserModalProps) {
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [wristNumber, setWristNumber] = useState(user?.wristNumber?.toString() ?? "");
  const [houseNumber, setHouseNumber] = useState(user?.houseNumber?.toString() ?? "");
  const [banUntil, setBanUntil] = useState<Date | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanPickerOpen, setIsBanPickerOpen] = useState(false);

  const handleSave = () => {
    if (!user) return;
    onSave(user.id, firstName.trim(), lastName.trim(), wristNumber, houseNumber);
  };

  const handleDelete = () => {
    if (!user) return;
    onDelete(user.id);
  };

  const handleBan = () => {
    if (!user) return;
    if (!banUntil) return;
    onBan(user.id, banUntil.getTime(), banReason.trim());
  };

  const banReady = isBanReady(banUntil);
  const nameValid = isNameValid(firstName, lastName);
  const banLabel = formatBanLabel(banUntil);

  const openBanPicker = () => {
    setIsBanPickerOpen(true);
  };

  return (
    <AdminModal
      visible={visible}
      onClose={onClose}
      title="Edit User"
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={onClose} variant="cancel" />
          <AdminModalButton
            title="Save"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || !user || !nameValid}
          />
        </>
      }
    >
      {user ? (
        <>
          <View style={{ marginBottom: spacing.md }}>
            <Text
              style={{
                fontSize: typography.lg,
                fontWeight: typography.bold,
                color: palette.white,
                marginBottom: spacing.xs,
              }}
            >
              {formatDisplayName(firstName, lastName, "Unknown user")}
            </Text>
            <Text style={{ fontSize: typography.sm, color: palette.textSecondary }}>
              {user.email ?? "No email"}
            </Text>
          </View>

          <FormField label="First name" required={true}>
            <ThemedTextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name..."
              autoCapitalize="words"
            />
          </FormField>

          <FormField label="Last name" required={true}>
            <ThemedTextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name..."
              autoCapitalize="words"
            />
          </FormField>

          <FormField label="Wrist #">
            <ThemedTextInput
              value={wristNumber}
              onChangeText={setWristNumber}
              placeholder="None"
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="House #">
            <ThemedTextInput
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="None"
              keyboardType="numeric"
            />
          </FormField>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temporary Ban</Text>
            <Text style={styles.sectionHint}>Pick a date and time to ban until</Text>
            <TouchableOpacity style={styles.banPickerButton} onPress={openBanPicker}>
              <Text style={styles.banPickerButtonText}>{banLabel}</Text>
            </TouchableOpacity>
            <FormField label="Reason">
              <ThemedTextInput
                value={banReason}
                onChangeText={setBanReason}
                placeholder="Optional reason for the ban"
                multiline={true}
              />
            </FormField>
            <DateTimePickerModal
              visible={isBanPickerOpen}
              value={banUntil ?? new Date()}
              mode="datetime"
              onConfirm={(date) => {
                setBanUntil(date);
                setIsBanPickerOpen(false);
              }}
              onCancel={() => setIsBanPickerOpen(false)}
            />
            <TouchableOpacity
              style={[
                styles.banButton,
                !banReady || isBanning ? styles.dangerButtonDisabled : null,
              ]}
              onPress={handleBan}
              disabled={!banReady || isBanning}
            >
              <Text style={styles.banButtonText}>{isBanning ? "Banning..." : "Ban user"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting ? styles.dangerButtonDisabled : null]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? "Deleting..." : "Delete user"}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </AdminModal>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    section: {
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.base,
      fontWeight: typography.semibold,
      color: palette.white,
      marginBottom: spacing.xs,
    },
    sectionHint: {
      fontSize: typography.sm,
      color: palette.textSecondary,
      marginBottom: spacing.sm,
    },
    banPickerButton: {
      backgroundColor: palette.backgroundDark,
      borderWidth: 1,
      borderColor: palette.borderDark,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    banPickerButtonText: {
      fontSize: typography.base,
      color: palette.white,
    },
    banButton: {
      backgroundColor: colors.danger,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      alignItems: "center",
    },
    dangerButtonDisabled: {
      opacity: 0.5,
    },
    banButtonText: {
      fontSize: typography.base,
      color: palette.white,
      fontWeight: typography.medium,
    },
    deleteButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      alignItems: "center",
      marginTop: spacing.lg,
    },
    deleteButtonText: {
      fontSize: typography.base,
      color: colors.danger,
      fontWeight: typography.medium,
    },
  });
}
