import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { statusOptions } from "~/components/admin/challenges/challengeFormConstants";
import type { useChallengeForm } from "~/hooks/admin/useChallengeForm";
import { ChallengeFormModals } from "../../admin/challenges/ChallengeFormModals";
import { renderWithProviders } from "../helpers/renderWithProviders";

interface DateTimePickerModalProps {
  visible: boolean;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

jest.mock("~/components/common/ui/DateTimePickerModal", () => ({
  DateTimePickerModal: ({ visible, onConfirm, onCancel }: DateTimePickerModalProps) => {
    const React = require("react");

    const { View, Text, TouchableOpacity } = require("react-native");
    if (!visible) return null;
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, "DateTimePickerModal"),
      React.createElement(
        TouchableOpacity,
        { onPress: () => onConfirm(new Date("2024-01-01T12:00:00.000Z")) },
        React.createElement(Text, null, "Confirm date"),
      ),
      React.createElement(
        TouchableOpacity,
        { onPress: onCancel },
        React.createElement(Text, null, "Cancel date"),
      ),
    );
  },
}));

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

jest.mock("~/components/common/QrScannerModal", () => ({
  QrScannerModal: ({ visible, onClose, onScan }: QrScannerModalProps) => {
    const React = require("react");

    const { View, Text, TouchableOpacity } = require("react-native");
    if (!visible) return null;
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, "QrScannerModal"),
      React.createElement(
        TouchableOpacity,
        { onPress: () => onScan("QR-123") },
        React.createElement(Text, null, "Scan QR"),
      ),
      React.createElement(
        TouchableOpacity,
        { onPress: onClose },
        React.createElement(Text, null, "Close scanner"),
      ),
    );
  },
}));

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: { latitude: number; longitude: number }) => void;
}

jest.mock("~/components/map/LocationPicker", () => ({
  LocationPicker: ({ visible, onClose, onLocationSelected }: LocationPickerProps) => {
    const React = require("react");

    const { View, Text, TouchableOpacity } = require("react-native");
    if (!visible) return null;
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, "LocationPicker"),
      React.createElement(
        TouchableOpacity,
        { onPress: () => onLocationSelected({ latitude: 50, longitude: 20 }) },
        React.createElement(Text, null, "Select location"),
      ),
      React.createElement(
        TouchableOpacity,
        { onPress: onClose },
        React.createElement(Text, null, "Close location"),
      ),
    );
  },
}));

describe("ChallengeFormModals", () => {
  const updateForm = jest.fn();
  const setActivePicker = jest.fn();
  const setActiveSelect = jest.fn();
  const setShowLocationPicker = jest.fn();
  const setIsQrScannerOpen = jest.fn();

  const baseFormState = {
    form: {
      targetLocation: null,
      title: "",
      description: "",
      image: "",
      submissionType: "TEXT" as const,
      scoringCategory: "SPEED" as const,
      qrCodeValue: "",
      textExpectedPhrase: "",
      basePoints: "",
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
    },
    activePicker: null as "startTime" | "endTime" | "dailyStartTime" | "dailyEndTime" | null,
    activeSelect: null as "submissionType" | "scoringCategory" | "status" | null,
    showLocationPicker: false,
    isQrScannerOpen: false,
    activeSelectOptions: statusOptions,
    imagePreviewUri: "",
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
    canUsePeerVoting: false,
    initialImage: "",
    initializedChallengeId: "",
    uploadError: null,
    uploadProgress: { percent: null, bytesUploaded: 0, bytesTotal: null },
    uploadStatus: "idle" as const,
    updateForm,
    handleSubmissionTypeChange: jest.fn(),
    handleScoringChange: jest.fn(),
    setActivePicker,
    setActiveSelect,
    setShowLocationPicker,
    setIsQrScannerOpen,
    setImagePreviewUri: jest.fn(),
    setInitializedChallengeId: jest.fn(),
    openQrScanner: jest.fn(),
    openDatePicker: jest.fn(),
    validateForm: jest.fn(() => true),
    initializeFormFromChallenge: jest.fn(),
    handlePickImage: jest.fn(),
    formatTime: (value: Date) => value.toLocaleTimeString(),
    formatIso: jest.fn(),
    toOptionalInt: jest.fn(),
    toVotingDurationHours: jest.fn(),
  } as ReturnType<typeof useChallengeForm>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the supported modals when their state is active", () => {
    renderWithProviders(
      <ChallengeFormModals
        formState={{
          ...baseFormState,
          activePicker: "startTime",
          activeSelect: "status",
          showLocationPicker: true,
          isQrScannerOpen: true,
        }}
      />,
    );

    expect(screen.getByText("DateTimePickerModal")).toBeTruthy();
    expect(screen.getByText("QrScannerModal")).toBeTruthy();
    expect(screen.getByText("LocationPicker")).toBeTruthy();
    expect(screen.getByText("Hidden")).toBeTruthy();
  });

  it("wires picker, scanner, and location callbacks", () => {
    renderWithProviders(
      <ChallengeFormModals
        formState={{
          ...baseFormState,
          activePicker: "startTime",
          showLocationPicker: true,
          isQrScannerOpen: true,
        }}
      />,
    );

    fireEvent.press(screen.getByText("Confirm date"));
    expect(updateForm).toHaveBeenCalledWith("startTime", new Date("2024-01-01T12:00:00.000Z"));
    expect(setActivePicker).toHaveBeenCalledWith(null);

    fireEvent.press(screen.getByText("Scan QR"));
    expect(updateForm).toHaveBeenCalledWith("qrCodeValue", "QR-123");

    fireEvent.press(screen.getByText("Select location"));
    expect(updateForm).toHaveBeenCalledWith("targetLocation", {
      latitude: 50,
      longitude: 20,
    });
    expect(setShowLocationPicker).toHaveBeenCalledWith(false);
  });

  it("updates the selected option and closes the picker", () => {
    renderWithProviders(
      <ChallengeFormModals
        formState={{
          ...baseFormState,
          activeSelect: "status",
        }}
      />,
    );

    fireEvent.press(screen.getByText("Hidden"));
    expect(updateForm).toHaveBeenCalledWith("status", "HIDDEN");
    expect(setActiveSelect).toHaveBeenCalledWith(null);
  });
});
