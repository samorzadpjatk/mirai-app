import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import type { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import { ChallengeFormFields } from "../../admin/challenges/ChallengeFormFields";
import { renderWithProviders } from "../helpers/renderWithProviders";

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
    startTime: null,
    endTime: null,
    scoringCategory: "SPEED" as const,
  },
  imagePreviewUri: null,
  isPeerVoting: false,
  showPodiumPoints: false,
  isAutoApproveForced: false,
  isAutoApproveDisabled: false,
  needsLocation: false,
  showLocationPicker: false,
  isUploadingImage: false,
  imageUploadPercent: null,
  submissionTypeLabel: "Text",
  scoringCategoryLabel: "Standard",
  statusLabel: "Draft",
  activePicker: null,
  activeSelect: null,
  activeSelectOptions: [],
  canUsePeerVoting: false,
  handleScoringChange: jest.fn(),
  handleSubmissionTypeChange: jest.fn(),
  initialImage: null,
  initializedChallengeId: null,
  isQrScannerOpen: false,
  openQrScanner: mockOpenQrScanner,
  setActivePicker: jest.fn(),
  setActiveSelect: mockSetActiveSelect,
  setImagePreviewUri: mockSetImagePreviewUri,
  setInitializedChallengeId: jest.fn(),
  setIsQrScannerOpen: jest.fn(),
  setShowLocationPicker: mockSetShowLocationPicker,
  updateForm: mockUpdateForm,
  uploadError: null,
  uploadProgress: { percent: null, bytesUploaded: 0, bytesTotal: null },
  uploadStatus: "idle" as const,
  validateForm: jest.fn(() => true),
  initializeFormFromChallenge: jest.fn(),
  handlePickImage: mockHandlePickImage,
  openDatePicker: mockOpenDatePicker,
  formatTime: (value: Date) => value.toLocaleTimeString(),
  formatIso: jest.fn(),
  toOptionalInt: jest.fn(),
  toVotingDurationHours: jest.fn(),
} as ReturnType<typeof useChallengeForm>;

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

describe("ChallengeFormFields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the current form values", () => {
    renderWithProviders(
      <ChallengeFormFields
        formState={mockFormState}
        onSave={jest.fn()}
        saveButtonText="Save Changes"
        isSaving={false}
      />,
    );

    expect(screen.getByText("Edit Challenge")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("Existing Title")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("Existing Description")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("50")).toBeOnTheScreen();
  });

  it("updates base points through updateForm", () => {
    renderWithProviders(
      <ChallengeFormFields
        formState={mockFormState}
        onSave={jest.fn()}
        saveButtonText="Save Changes"
        isSaving={false}
      />,
    );

    fireEvent.changeText(screen.getByDisplayValue("50"), "120");
    expect(mockUpdateForm).toHaveBeenCalledWith("basePoints", "120");
  });

  it("opens the submission type selector", () => {
    renderWithProviders(
      <ChallengeFormFields
        formState={mockFormState}
        onSave={jest.fn()}
        saveButtonText="Save Changes"
        isSaving={false}
      />,
    );

    fireEvent.press(screen.getByText("Text"));
    expect(mockSetActiveSelect).toHaveBeenCalledWith("submissionType");
  });

  it("calls onSave from the primary button", () => {
    const onSave = jest.fn();
    renderWithProviders(
      <ChallengeFormFields
        formState={mockFormState}
        onSave={onSave}
        saveButtonText="Save Changes"
        isSaving={false}
      />,
    );

    fireEvent.press(screen.getByText("Save Changes"));
    expect(onSave).toHaveBeenCalled();
  });

  it("renders QR code field when submission type is QR_CODE", () => {
    const qrFormState = {
      ...mockFormState,
      form: { ...mockFormState.form, submissionType: "QR_CODE" as const },
      submissionTypeLabel: "QR Code",
    };
    renderWithProviders(
      <ChallengeFormFields
        formState={qrFormState}
        onSave={jest.fn()}
        saveButtonText="Save Changes"
        isSaving={false}
      />,
    );

    expect(screen.getByText("QR Code")).toBeOnTheScreen();
  });

  it("renders location field when needsLocation is true", () => {
    const locationFormState = {
      ...mockFormState,
      needsLocation: true,
      form: {
        ...mockFormState.form,
        targetLocation: { latitude: 52.2297, longitude: 21.0122 },
      },
    };
    renderWithProviders(
      <ChallengeFormFields
        formState={locationFormState}
        onSave={jest.fn()}
        saveButtonText="Save Changes"
        isSaving={false}
      />,
    );

    expect(screen.getByText("Target Location")).toBeOnTheScreen();
  });

  it("renders recurring fields when isRecurring is true", () => {
    const recurringFormState = {
      ...mockFormState,
      form: { ...mockFormState.form, isRecurring: true },
    };
    renderWithProviders(
      <ChallengeFormFields
        formState={recurringFormState}
        onSave={jest.fn()}
        saveButtonText="Save Changes"
        isSaving={false}
      />,
    );

    expect(screen.getByText("Daily Time Window")).toBeOnTheScreen();
  });

  it("renders New Challenge title when isNewChallenge is true", () => {
    renderWithProviders(
      <ChallengeFormFields
        formState={mockFormState}
        onSave={jest.fn()}
        saveButtonText="Create Challenge"
        isSaving={false}
        isNewChallenge={true}
      />,
    );

    expect(screen.getByText("New Challenge")).toBeOnTheScreen();
  });
});
