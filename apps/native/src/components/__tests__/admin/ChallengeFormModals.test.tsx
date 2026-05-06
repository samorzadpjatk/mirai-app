import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ChallengeFormModals } from "../../admin/challenges/ChallengeFormModals";

interface DateTimePickerModalProps {
  visible: boolean;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

jest.mock("~/components/common/ui/DateTimePickerModal", () => ({
  DateTimePickerModal: ({ visible, onConfirm, onCancel }: DateTimePickerModalProps) => {
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
    form: { targetLocation: null },
    activePicker: null,
    activeSelect: null,
    showLocationPicker: false,
    isQrScannerOpen: false,
    activeSelectOptions: [{ label: "Published", value: "PUBLISHED" }],
    updateForm,
    handleSubmissionTypeChange: jest.fn(),
    handleScoringChange: jest.fn(),
    setActivePicker,
    setActiveSelect,
    setShowLocationPicker,
    setIsQrScannerOpen,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the supported modals when their state is active", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormModals
        formState={{
          ...baseFormState,
          activePicker: "startTime",
          activeSelect: "status",
          showLocationPicker: true,
          isQrScannerOpen: true,
        } as unknown as typeof baseFormState}
      />
    );

    expect(getByText("DateTimePickerModal")).toBeTruthy();
    expect(getByText("QrScannerModal")).toBeTruthy();
    expect(getByText("LocationPicker")).toBeTruthy();
    expect(getByText("Published")).toBeTruthy();
  });

  it("wires picker, scanner, and location callbacks", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormModals
        formState={{
          ...baseFormState,
          activePicker: "startTime",
          showLocationPicker: true,
          isQrScannerOpen: true,
        } as unknown as typeof baseFormState}
      />
    );

    fireEvent.press(getByText("Confirm date"));
    expect(updateForm).toHaveBeenCalledWith("startTime", new Date("2024-01-01T12:00:00.000Z"));
    expect(setActivePicker).toHaveBeenCalledWith(null);

    fireEvent.press(getByText("Scan QR"));
    expect(updateForm).toHaveBeenCalledWith("qrCodeValue", "QR-123");

    fireEvent.press(getByText("Select location"));
    expect(updateForm).toHaveBeenCalledWith("targetLocation", {
      latitude: 50,
      longitude: 20,
    });
    expect(setShowLocationPicker).toHaveBeenCalledWith(false);
  });

  it("updates the selected option and closes the picker", () => {
    const { getByText } = renderWithProviders(
      <ChallengeFormModals
        formState={{
          ...baseFormState,
          activeSelect: "status",
        } as unknown as typeof baseFormState}
      />
    );

    fireEvent.press(getByText("Published"));
    expect(updateForm).toHaveBeenCalledWith("status", "PUBLISHED");
    expect(setActiveSelect).toHaveBeenCalledWith(null);
  });
});
