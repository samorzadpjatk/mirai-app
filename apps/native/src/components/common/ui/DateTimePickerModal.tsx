import React, { useState } from "react";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

export type DateTimePickerModalMode = "date" | "time" | "datetime";

export interface DateTimePickerModalProps {
  visible: boolean;
  value: Date;
  mode: DateTimePickerModalMode;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

/**
 * Unified date/time picker experience:
 * - Android: inline DateTimePicker, auto-confirms selection and closes.
 * - iOS: modal with spinner, Cancel/Done buttons.
 */
export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  value,
  mode,
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <DateTimePickerModalContent
      key={`${value.getTime()}-${mode}`}
      value={value}
      mode={mode}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

type DateTimePickerModalContentProps = Omit<DateTimePickerModalProps, "visible">;

const DateTimePickerModalContent: React.FC<DateTimePickerModalContentProps> = ({
  value,
  mode,
  onConfirm,
  onCancel,
}) => {
  const [draft, setDraft] = useState<Date>(value);

  if (Platform.OS === "android") {
    const handleAndroidChange = (
      event: DateTimePickerEvent,
      selected?: Date,
    ) => {
      if (event.type === "dismissed") {
        onCancel();
        return;
      }
      if (selected) {
        onConfirm(selected);
      }
      onCancel();
    };

    return (
      <DateTimePicker
        testID="datetime-picker"
        value={value}
        mode={mode === "datetime" ? "date" : mode}
        display="default"
        onChange={handleAndroidChange}
      />
    );
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel} testID="datetime-picker-overlay">
        <Pressable
          style={styles.card}
          onPress={(event) => event.stopPropagation()}
          testID="datetime-picker-card"
        >
          <DateTimePicker
            testID="datetime-picker"
            value={draft}
            mode={mode}
            display="spinner"
            onChange={(_, selected) => {
              if (selected) {
                setDraft(selected);
              }
            }}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => onConfirm(draft)}
            >
              <Text style={[styles.actionText, styles.actionTextPrimary]}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.blackOpacity40,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 360,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  actionTextPrimary: {
    color: colors.backgroundDark,
    fontWeight: typography.semibold,
  },
});
