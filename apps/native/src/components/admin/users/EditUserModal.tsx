import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, Platform, Pressable } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, typography } from '~/styles';
import { AdminModal, AdminModalButton } from '../AdminModal';
import type { User } from '~/hooks/admin/useAdminUsers';

interface EditUserModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (
    userId: string,
    firstName: string,
    lastName: string,
    wristNumber: string,
    houseNumber: string
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
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [wristNumber, setWristNumber] = useState(user?.wristNumber?.toString() ?? '');
  const [houseNumber, setHouseNumber] = useState(user?.houseNumber?.toString() ?? '');
  const [banUntil, setBanUntil] = useState<Date | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanPickerOpen, setIsBanPickerOpen] = useState(false);
  const [pickerDraftDate, setPickerDraftDate] = useState<Date>(new Date());

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

  const isBanReady = banUntil != null && banUntil > new Date();
  const isNameValid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const banLabel = banUntil
    ? `${banUntil.toLocaleDateString()} • ${banUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Select date & time';

  const openBanPicker = () => {
    setPickerDraftDate(banUntil ?? new Date());
    setIsBanPickerOpen(true);
  };

  const handleBanDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setIsBanPickerOpen(false);
        return;
      }
      if (selected) {
        setBanUntil(selected);
      }
      setIsBanPickerOpen(false);
      return;
    }

    if (selected) {
      setPickerDraftDate(selected);
    }
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
          <View style={styles.userMeta}>
            <Text style={styles.userName}>
              {[firstName, lastName].filter(Boolean).join(' ') || 'Unknown user'}
            </Text>
            <Text style={styles.userEmail}>{user.email ?? 'No email'}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First name</Text>
            <TextInput
              style={styles.textInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last name</Text>
            <TextInput
              style={styles.textInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Wrist #</Text>
            <TextInput
              style={styles.textInput}
              value={wristNumber}
              onChangeText={setWristNumber}
              placeholder="None"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>House #</Text>
            <TextInput
              style={styles.textInput}
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="None"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temporary Ban</Text>
            <Text style={styles.sectionHint}>Pick a date and time to ban until</Text>
            <TouchableOpacity style={styles.banPickerButton} onPress={openBanPicker}>
              <Text style={styles.banPickerButtonText}>{banLabel}</Text>
            </TouchableOpacity>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={[styles.textInput, styles.reasonInput]}
                value={banReason}
                onChangeText={setBanReason}
                placeholder="Optional reason for the ban"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
            {isBanPickerOpen && Platform.OS === 'android' ? (
              <DateTimePicker
                value={banUntil ?? new Date()}
                mode="datetime"
                onChange={handleBanDateChange}
              />
            ) : null}
            <TouchableOpacity
              style={[
                styles.banButton,
                !isBanReady || isBanning ? styles.dangerButtonDisabled : null,
              ]}
              onPress={handleBan}
              disabled={!isBanReady || isBanning}
            >
              <Text style={styles.banButtonText}>
                {isBanning ? 'Banning...' : 'Ban user'}
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
              {isDeleting ? 'Deleting...' : 'Delete user'}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}

      <Modal
        visible={isBanPickerOpen && Platform.OS === 'ios'}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBanPickerOpen(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setIsBanPickerOpen(false)}>
          <Pressable style={styles.pickerCard} onPress={(event) => event.stopPropagation()}>
            <DateTimePicker
              value={pickerDraftDate}
              mode="datetime"
              display="spinner"
              onChange={handleBanDateChange}
            />
            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={styles.pickerActionButton}
                onPress={() => setIsBanPickerOpen(false)}
              >
                <Text style={styles.pickerActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerActionButton, styles.pickerActionButtonPrimary]}
                onPress={() => {
                  setBanUntil(pickerDraftDate);
                  setIsBanPickerOpen(false);
                }}
              >
                <Text style={[styles.pickerActionText, styles.pickerActionTextPrimary]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AdminModal>
  );
}

const styles = StyleSheet.create({
  userMeta: {
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  reasonInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  section: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  banPickerButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundDark,
    marginBottom: spacing.md,
  },
  banPickerButtonText: {
    fontSize: typography.base,
    color: colors.white,
  },
  banButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  deleteButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  dangerButtonDisabled: {
    opacity: 0.6,
  },
  banButtonText: {
    fontSize: typography.sm,
    color: colors.warning,
    fontWeight: typography.medium,
  },
  deleteButtonText: {
    fontSize: typography.sm,
    color: colors.danger,
    fontWeight: typography.medium,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: colors.backgroundDarkOpacity80,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pickerCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  pickerActionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pickerActionButtonPrimary: {
    backgroundColor: colors.primaryOpacity20,
    borderRadius: borderRadius.md,
  },
  pickerActionText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  pickerActionTextPrimary: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
});
