import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeFormFields } from "../../../admin/challenges/ChallengeFormFields";
import { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import type { VotingDurationUnit } from "~/components/admin/challenges/challengeFormConstants";

type FormState = ReturnType<typeof useChallengeForm>;

const baseFormState = (overrides: Partial<FormState> = {}): FormState => {
  const mockUpdateForm = jest.fn();
  const mockHandlePickImage = jest.fn();
  const mockOpenDatePicker = jest.fn();
  const mockSetActiveSelect = jest.fn();
  const mockSetShowLocationPicker = jest.fn();
  const mockSetActivePicker = jest.fn();
  const mockSetIsQrScannerOpen = jest.fn();
  const mockSetInitializedChallengeId = jest.fn();
  const mockSetImagePreviewUri = jest.fn();
  const mockOpenQrScanner = jest.fn();
  const mockHandleScoringChange = jest.fn();
  const mockHandleSubmissionTypeChange = jest.fn();
  const mockValidateForm = jest.fn(() => true);
  const mockInitializeFormFromChallenge = jest.fn();

  const state: FormState = {
    form: {
      title: "Test Challenge",
      description: "Test description",
      image: "",
      submissionType: "IMAGE",
      scoringCategory: "SPEED",
      isRecurring: false,
      dailyStartTime: null,
      dailyEndTime: null,
      recurringDays: "",
      basePoints: "10",
      firstPlacePoints: "",
      secondPlacePoints: "",
      thirdPlacePoints: "",
      status: "HIDDEN",
      startTime: null,
      endTime: null,
      votingDurationValue: "",
      votingDurationUnit: "HOURS",
      targetLocation: null,
      qrCodeValue: "",
      textExpectedPhrase: "",
      autoApprove: false,
    },
    imagePreviewUri: null,
    isPeerVoting: false,
    showPodiumPoints: true,
    isAutoApproveForced: false,
    isAutoApproveDisabled: true,
    needsLocation: false,
    isUploadingImage: false,
    imageUploadPercent: null,
    submissionTypeLabel: "Image",
    scoringCategoryLabel: "Speed",
    statusLabel: "Hidden",
    activePicker: null,
    activeSelect: null,
    showLocationPicker: false,
    isQrScannerOpen: false,
    initialImage: null,
    initializedChallengeId: null,
    uploadStatus: "idle",
    uploadProgress: { percent: null, bytesTotal: null, bytesUploaded: 0 },
    uploadError: null,
    canUsePeerVoting: true,
    activeSelectOptions: [],
    updateForm: (field, value) => mockUpdateForm(field, value),
    handlePickImage: () => mockHandlePickImage(),
    openDatePicker: (field) => mockOpenDatePicker(field),
    setActiveSelect: (value) => mockSetActiveSelect(value),
    setShowLocationPicker: (value) => mockSetShowLocationPicker(value),
    setActivePicker: (value) => mockSetActivePicker(value),
    setIsQrScannerOpen: (value) => mockSetIsQrScannerOpen(value),
    setInitializedChallengeId: (value) => mockSetInitializedChallengeId(value),
    formatTime: (time: Date | null) => (time ? time.toISOString() : "--:--"),
    formatIso: (date) => (date ? date.toISOString() : ""),
    setImagePreviewUri: (value) => mockSetImagePreviewUri(value),
    openQrScanner: () => mockOpenQrScanner(),
    handleScoringChange: (value) => mockHandleScoringChange(value),
    handleSubmissionTypeChange: (value) => mockHandleSubmissionTypeChange(value),
    validateForm: () => mockValidateForm(),
    initializeFormFromChallenge: (challenge) => mockInitializeFormFromChallenge(challenge),
    toOptionalInt: (value) => (value ? parseInt(value, 10) : undefined),
    toVotingDurationHours: (value, unit) => 1,
    ...overrides,
  };

  return state;
};

describe("ChallengeFormFields", () => {
  it("renders form fields", () => {
    const { getByText, getAllByTestId } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState()}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(getByText("Edit Challenge")).toBeTruthy();
    expect(getByText("Basics")).toBeTruthy();
    expect(getByText("Scoring")).toBeTruthy();
    expect(getAllByTestId("form-field-label").length).toBeGreaterThanOrEqual(1);
  });

  it("renders new challenge title", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState()}
        onSave={jest.fn()}
        saveButtonText="Create"
        isSaving={false}
        isNewChallenge={true}
      />,
    );

    expect(getByText("New Challenge")).toBeTruthy();
  });

  it("calls updateForm when title changes", () => {
    const updateForm = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({ updateForm })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("e.g. Campus Marathon"), "New Title");
    expect(updateForm).toHaveBeenCalledWith("title", "New Title");
  });

  it("calls updateForm when description changes", () => {
    const updateForm = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({ updateForm })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.changeText(
      getByPlaceholderText("Describe the goal of this challenge..."),
      "New Description",
    );
    expect(updateForm).toHaveBeenCalledWith("description", "New Description");
  });

  it("calls onSave when save button pressed", () => {
    const onSave = jest.fn();
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState()}
        onSave={onSave}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.press(getByText("Save"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows saving state", () => {
    const { getByTestId } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState()}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={true}
      />,
    );

    expect(getByTestId("undefined-loading-indicator")).toBeTruthy();
  });

  it("calls setActiveSelect for submission type", () => {
    const setActiveSelect = jest.fn();
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({ setActiveSelect })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.press(getByText("Image"));
    expect(setActiveSelect).toHaveBeenCalledWith("submissionType");
  });

  it("shows QR code field for QR_CODE type", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          form: {
            ...baseFormState().form,
            submissionType: "QR_CODE",
          },
          submissionTypeLabel: "QR Code",
          isAutoApproveForced: true,
          isAutoApproveDisabled: false,
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(getByText("Expected QR code value")).toBeTruthy();
  });

  it("shows text phrase field for TEXT type", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          form: {
            ...baseFormState().form,
            submissionType: "TEXT",
          },
          submissionTypeLabel: "Text",
          isAutoApproveDisabled: false,
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(getByText("Expected phrase (optional)")).toBeTruthy();
  });

  it("shows location field when needsLocation is true", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          form: {
            ...baseFormState().form,
            submissionType: "LOCATION",
          },
          needsLocation: true,
          submissionTypeLabel: "Location",
          isAutoApproveForced: true,
          isAutoApproveDisabled: false,
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(getByText("Target Location")).toBeTruthy();
  });

  it("shows podium points when showPodiumPoints is true", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({ showPodiumPoints: true })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(getByText("Podium Points (optional)")).toBeTruthy();
  });

  it("shows recurring fields when isRecurring is true", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          form: {
            ...baseFormState().form,
            isRecurring: true,
          },
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(getByText("Daily Time Window")).toBeTruthy();
    expect(getByText("Recurring Days")).toBeTruthy();
  });

  it("shows voting duration when isPeerVoting is true", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          form: {
            ...baseFormState().form,
            scoringCategory: "PEER_VOTING",
            submissionType: "IMAGE",
          },
          isPeerVoting: true,
          scoringCategoryLabel: "Peer Voting",
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(getByText("Voting Duration")).toBeTruthy();
  });

  it("shows auto-approve forced hint", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          isAutoApproveForced: true,
          isAutoApproveDisabled: false,
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(
      getByText("Auto-approve is always enabled for QR code and Location challenges."),
    ).toBeTruthy();
  });

  it("shows auto-approve disabled hint", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          isAutoApproveForced: false,
          isAutoApproveDisabled: true,
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    expect(
      getByText("Auto-approve is not available for Image, Video and Image + Location challenges."),
    ).toBeTruthy();
  });

  it("calls handlePickImage when upload image pressed", () => {
    const handlePickImage = jest.fn();
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({ handlePickImage })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.press(getByText("Upload Image"));
    expect(handlePickImage).toHaveBeenCalled();
  });

  it("calls setImagePreviewUri when clear image pressed", () => {
    const setImagePreviewUri = jest.fn();
    const updateForm = jest.fn();
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          setImagePreviewUri,
          updateForm,
          imagePreviewUri: "https://example.com/image.jpg",
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.press(getByText("Clear"));
    expect(setImagePreviewUri).toHaveBeenCalledWith(null);
    expect(updateForm).toHaveBeenCalledWith("image", "");
  });

  it("calls openQrScanner when scan QR pressed", () => {
    const openQrScanner = jest.fn();
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          form: { ...baseFormState().form, submissionType: "QR_CODE" },
          submissionTypeLabel: "QR Code",
          isAutoApproveForced: true,
          isAutoApproveDisabled: false,
          openQrScanner,
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.press(getByText("Scan QR"));
    expect(openQrScanner).toHaveBeenCalled();
  });

  it("calls setShowLocationPicker when location card pressed", () => {
    const setShowLocationPicker = jest.fn();
    const { getByText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          form: { ...baseFormState().form, submissionType: "LOCATION" },
          needsLocation: true,
          submissionTypeLabel: "Location",
          isAutoApproveForced: true,
          isAutoApproveDisabled: false,
          setShowLocationPicker,
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.press(getByText("Tap to select location on map"));
    expect(setShowLocationPicker).toHaveBeenCalledWith(true);
  });

  it("calls updateForm when base points changes", () => {
    const updateForm = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({ updateForm })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("0"), "100");
    expect(updateForm).toHaveBeenCalledWith("basePoints", "100");
  });

  it("calls updateForm when recurring toggled", () => {
    const updateForm = jest.fn();
    const { getAllByRole } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({ updateForm })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    const switchEls = getAllByRole("switch");
    const firstSwitch = switchEls[0];
    if (!firstSwitch) throw new Error("Switch not found");
    fireEvent(firstSwitch, "valueChange", true);
    expect(updateForm).toHaveBeenCalledWith("isRecurring", true);
  });

  it("calls updateForm when auto-approve toggled", () => {
    const updateForm = jest.fn();
    const { getAllByRole } = renderWithProviders(
      <ChallengeFormFields
        formState={baseFormState({
          isAutoApproveForced: false,
          isAutoApproveDisabled: false,
          updateForm,
        })}
        onSave={jest.fn()}
        saveButtonText="Save"
        isSaving={false}
      />,
    );

    const switchEls = getAllByRole("switch");
    const secondSwitch = switchEls[1];
    if (!secondSwitch) throw new Error("Switch not found");
    fireEvent(secondSwitch, "valueChange", true);
    expect(updateForm).toHaveBeenCalledWith("autoApprove", true);
  });
});

import {
  formatLocationText,
  getAutoApproveSwitchValue,
  getAutoApproveThumbColor,
} from "../../../admin/challenges/ChallengeFormFields";

describe("formatLocationText", () => {
  it("should return placeholder when no location", () => {
    expect(formatLocationText(null)).toBe("Tap to select location on map");
  });

  it("should format location with 5 decimal places", () => {
    expect(formatLocationText({ latitude: 52.229766, longitude: 21.012234 })).toBe(
      "Selected: 52.22977, 21.01223",
    );
  });
});

describe("getAutoApproveSwitchValue", () => {
  it("should return true when forced", () => {
    expect(getAutoApproveSwitchValue(true, false, false)).toBe(true);
  });

  it("should return false when disabled", () => {
    expect(getAutoApproveSwitchValue(false, true, true)).toBe(false);
  });

  it("should return autoApprove value when not forced or disabled", () => {
    expect(getAutoApproveSwitchValue(false, false, true)).toBe(true);
    expect(getAutoApproveSwitchValue(false, false, false)).toBe(false);
  });
});

describe("getAutoApproveThumbColor", () => {
  it("should return primary color when forced and not disabled", () => {
    expect(getAutoApproveThumbColor(true, false, false, "#FF0000", "#999")).toBe("#FF0000");
  });

  it("should return primary color when autoApprove and not disabled", () => {
    expect(getAutoApproveThumbColor(false, false, true, "#FF0000", "#999")).toBe("#FF0000");
  });

  it("should return text secondary when disabled", () => {
    expect(getAutoApproveThumbColor(false, true, true, "#FF0000", "#999")).toBe("#999");
  });

  it("should return text secondary when not forced and autoApprove off", () => {
    expect(getAutoApproveThumbColor(false, false, false, "#FF0000", "#999")).toBe("#999");
  });
});
