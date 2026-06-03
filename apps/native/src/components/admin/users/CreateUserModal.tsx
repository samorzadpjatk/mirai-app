import { useState } from "react";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { isNameValid, isNonEmptyString } from "~/utils/validation";
import { AdminModal, AdminModalButton } from "../AdminModal";

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

  const isValid = isNameValid(firstName, lastName) && isNonEmptyString(email);

  const handleCreate = () => {
    if (!isValid) return;
    onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    });
  };

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
      <FormField label="Email" required={true}>
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
