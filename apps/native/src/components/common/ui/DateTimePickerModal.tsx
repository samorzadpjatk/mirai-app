import React, { useState } from "react";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Modal, Platform } from "react-native";
import { YStack, XStack, Text, Button } from "@mirai-app/ui";

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

type DateTimePickerModalContentProps = Omit<
  DateTimePickerModalProps,
  "visible"
>;

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
        value={value}
        mode={mode === "datetime" ? "date" : mode}
        display="default"
        onChange={handleAndroidChange}
      />
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Button
        onPress={onCancel}
        fullscreen
        position="absolute"
        backgroundColor="rgba(0,0,0,0.4)"
        justifyContent="center"
        alignItems="center"
        padding="$lg"
      >
        <YStack
          backgroundColor="rgba(27, 40, 40, 0.95)"
          borderRadius="$lg"
          padding="$lg"
          width="100%"
          maxWidth={360}
        >
          <DateTimePicker
            value={draft}
            mode={mode}
            display="spinner"
            onChange={(_, selected) => {
              if (selected) {
                setDraft(selected);
              }
            }}
          />
          <XStack gap="$sm" marginTop="$md">
            <Button
              onPress={onCancel}
              flex={1}
              padding="$sm"
              borderRadius="$md"
              alignItems="center"
              backgroundColor="rgba(23, 24, 28, 0.9)"
              borderWidth={1}
              borderColor="#395556"
            >
              <Text fontSize="$base" color="rgba(156, 163, 175, 0.9)">
                Cancel
              </Text>
            </Button>
            <Button
              onPress={() => onConfirm(draft)}
              flex={1}
              padding="$sm"
              borderRadius="$md"
              alignItems="center"
              backgroundColor="rgba(0, 206, 209, 0.9)"
              borderWidth={1}
              borderColor="#00ced1"
            >
              <Text
                fontSize="$base"
                color="rgba(23, 24, 28, 0.9)"
                fontWeight="600"
              >
                Done
              </Text>
            </Button>
          </XStack>
        </YStack>
      </Button>
    </Modal>
  );
};
