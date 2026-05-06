import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ChallengeFormFields } from "../../admin/challenges/ChallengeFormFields";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

const mockUpdateForm = jest.fn();
const mockHandlePickImage = jest.fn();
const mockOpenDatePicker = jest.fn();
const mockSetActiveSelect = jest.fn();
const mockSetShowLocationPicker = jest.fn();
const mockSetImagePreviewUri = jest.fn();
const mockOpenQrScanner = jest.fn();

const mockFormState = {
  form: {
    title: "Existing Title",
    description: "Existing Description",
    image: "",
    submissionType: "TEXT" as const,
    qrCodeValue: "",
    textExpectedPhrase: "",
    targetLocation: null,
    basePoints: "50",
    firstPlacePoints: "",
    secondPlacePoints: "",
    thirdPlacePoints: "",
    isRecurring: false,
    dailyStartTime: null,
    dailyEndTime: null,
    recurringDays: "",
    votingDurationValue: "",
    votingDurationUnit: "HOURS" as const,
    status: "DRAFT" as const,
    autoApprove: false,
  },
  imagePreviewUri: null,
  isPeerVoting: false,
  showPodiumPoints: false,
  isAutoApproveForced: false,
  isAutoApproveDisabled: false,
  needsLocation: false,
  isUploadingImage: false,
  imageUploadPercent: null,
  submissionTypeLabel: "Text",
  scoringCategoryLabel: "Standard",
  statusLabel: "Draft",
  updateForm: mockUpdateForm,
  handlePickImage: mockHandlePickImage,
  openDatePicker: mockOpenDatePicker,
  setActiveSelect: mockSetActiveSelect,
  setShowLocationPicker: mockSetShowLocationPicker,
  setImagePreviewUri: mockSetImagePreviewUri,
  openQrScanner: mockOpenQrScanner,
  formatTime: (value: Date) => value.toLocaleTimeString(),
};

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
}

interface ThemedTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: string;
  multiline?: boolean;
}

interface PrimaryLoadingButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

jest.mock("~/components/common/ui", () => {
  const ReactNative = require("react-native");
  return {
    FormField: ({ children, label }: FormFieldProps) => (<ReactNative.View><ReactNative.Text>{label}</ReactNative.Text>{children}</ReactNative.View>),
    ThemedTextInput: ({ value, onChangeText, placeholder, keyboardType, multiline }: ThemedTextInputProps) => (<ReactNative.TextInput value={value} placeholder={placeholder} keyboardType={keyboardType} multiline={multiline} onChangeText={onChangeText} />),
    PrimaryLoadingButton: ({ label, onPress, isLoading, disabled }: PrimaryLoadingButtonProps) => (<ReactNative.TouchableOpacity onPress={onPress} disabled={(isLoading ?? false) || (disabled ?? false)}><ReactNative.Text>{label}</ReactNative.Text></ReactNative.TouchableOpacity>),
  };
});

describe("ChallengeFormFields", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("renders the current form values", () => {
    renderWithProviders(
      <ChallengeFormFields formState={mockFormState} onSave={jest.fn()} saveButtonText="Save Changes" isSaving={false} />
    );

    expect(screen.getByText("Edit Challenge")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("Existing Title")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("Existing Description")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("50")).toBeOnTheScreen();
  });

  it("updates base points through updateForm", () => {
    renderWithProviders(
      <ChallengeFormFields formState={mockFormState} onSave={jest.fn()} saveButtonText="Save Changes" isSaving={false} />
    );

    fireEvent.changeText(screen.getByDisplayValue("50"), "120");
    expect(mockUpdateForm).toHaveBeenCalledWith("basePoints", "120");
  });

  it("opens the submission type selector", () => {
    renderWithProviders(
      <ChallengeFormFields formState={mockFormState} onSave={jest.fn()} saveButtonText="Save Changes" isSaving={false} />
    );

    fireEvent.press(screen.getByText("Text"));
    expect(mockSetActiveSelect).toHaveBeenCalledWith("submissionType");
  });

  it("calls onSave from the primary button", () => {
    const onSave = jest.fn();
    renderWithProviders(
      <ChallengeFormFields formState={mockFormState} onSave={onSave} saveButtonText="Save Changes" isSaving={false} />
    );

    fireEvent.press(screen.getByText("Save Changes"));
    expect(onSave).toHaveBeenCalled();
  });
});
