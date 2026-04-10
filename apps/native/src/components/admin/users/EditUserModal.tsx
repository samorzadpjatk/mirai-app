import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, typography } from "~/styles";
import { AdminModal, AdminModalButton } from "../AdminModal";
import {
  FormField,
  ThemedTextInput,
  DateTimePickerModal,
} from "~/components/common/ui";
import type { User } from "@mirai-app/graphql-types";

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
  // GraphQL User type has firstName/lastName but may not have email/wrist/house fields yet
  // Access extended fields safely with type assertions until schema is updated
  const extendedUser = user as unknown as {
    email?: string;
    wristNumber?: string | number;
    houseNumber?: string | number;
  } | null;

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [wristNumber, setWristNumber] = useState(
    extendedUser?.wristNumber?.toString() ?? "",
  );
  const [houseNumber, setHouseNumber] = useState(
    extendedUser?.houseNumber?.toString() ?? "",
  );
  const [banUntil, setBanUntil] = useState<Date | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanPickerOpen, setIsBanPickerOpen] = useState(false);

  const handleSave = () => {
    if (!user) return;
    onSave(
      user.id,
      firstName.trim(),
      lastName.trim(),
      wristNumber,
      houseNumber,
    );
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

  const isBanReady = banUntil != null && banUntil > new Date();
  const isNameValid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const banLabel = banUntil
    ? `${banUntil.toLocaleDateString()} • ${banUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Select date & time";

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
            disabled={isSaving || !user || !isNameValid}
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
                color: colors.white,
                marginBottom: spacing.xs,
              }}
            >
              {[firstName, lastName].filter(Boolean).join(" ") ||
                "Unknown user"}
            </Text>
            <Text
              style={{ fontSize: typography.sm, color: colors.textSecondary }}
            >
              {extendedUser?.email ?? "No email"}
            </Text>
          </View>

          <FormField label="First name" required>
            <ThemedTextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name..."
              autoCapitalize="words"
            />
          </FormField>

          <FormField label="Last name" required>
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
            <Text style={styles.sectionHint}>
              Pick a date and time to ban until
            </Text>
            <TouchableOpacity
              style={styles.banPickerButton}
              onPress={openBanPicker}
            >
              <Text style={styles.banPickerButtonText}>{banLabel}</Text>
            </TouchableOpacity>
            <FormField label="Reason">
              <ThemedTextInput
                value={banReason}
                onChangeText={setBanReason}
                placeholder="Optional reason for the ban"
                multiline
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
                !isBanReady || isBanning ? styles.dangerButtonDisabled : null,
              ]}
              onPress={handleBan}
              disabled={!isBanReady || isBanning}
            >
              <Text style={styles.banButtonText}>
                {isBanning ? "Banning..." : "Ban user"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              isDeleting ? styles.dangerButtonDisabled : null,
            ]}
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

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  banPickerButton: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  banPickerButtonText: {
    fontSize: typography.base,
    color: colors.white,
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
    color: colors.white,
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
