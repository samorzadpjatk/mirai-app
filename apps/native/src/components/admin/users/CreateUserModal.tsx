import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '~/styles';
import { AdminModal, AdminModalButton } from '../AdminModal';

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: { firstName: string; lastName: string; email: string }) => void;
  isCreating: boolean;
}

export function CreateUserModal({
  visible,
  onClose,
  onCreate,
  isCreating,
}: CreateUserModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    onClose();
  };

  const handleCreate = () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) return;
    onCreate({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
    });
  };

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0;

  return (
    <AdminModal
      visible={visible}
      onClose={handleClose}
      title="Create User"
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={handleClose} variant="cancel" />
          <AdminModalButton
            title="Create"
            onPress={handleCreate}
            disabled={!isValid}
            loading={isCreating}
          />
        </>
      }
    >
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
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.textInput}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email..."
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </AdminModal>
  );
}

const styles = StyleSheet.create({
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
});
