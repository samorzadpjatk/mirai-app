import React, { useState } from "react";
import { AdminModal, AdminModalButton } from "../AdminModal";
import { FormField, ThemedTextInput } from "~/components/common/ui";

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: { firstName: string; lastName: string; email: string }) => void;
  isCreating: boolean;
}

export function CreateUserModal({ visible, onClose, onCreate, isCreating }: CreateUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const handleClose = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
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
    firstName.trim().length > 0 && lastName.trim().length > 0 && email.trim().length > 0;

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
      <FormField label="Email" required>
        <ThemedTextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email..."
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </FormField>
    </AdminModal>
  );
}
