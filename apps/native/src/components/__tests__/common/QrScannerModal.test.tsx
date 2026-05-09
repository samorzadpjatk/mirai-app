import React from "react";
import { Alert, type Modal, View } from "react-native";
import { fireEvent, screen, userEvent, waitFor } from "@testing-library/react-native";
import { useCameraPermissions } from "expo-camera";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { QrScannerModal } from "../../common/QrScannerModal";

interface BarcodeScannedEvent {
  data: string;
}

interface CameraViewMockProps {
  facing: "back" | "front";
  barcodeScannerSettings: { barcodeTypes: ["qr"] };
  onBarcodeScanned?: (event: BarcodeScannedEvent) => void | Promise<void>;
}

jest.mock("expo-camera", () => ({
  CameraView: (props: CameraViewMockProps) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, {
      testID: "camera-view",
      ...props,
    });
  },
  useCameraPermissions: jest.fn(),
}));

const mockUseCameraPermissions = useCameraPermissions as jest.MockedFunction<typeof useCameraPermissions>;
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

type PermissionReturn = ReturnType<typeof useCameraPermissions>;

const createMockPermissionReturn = (granted: boolean): PermissionReturn => {
  const requestFn = jest.fn(() => Promise.resolve({ granted, canAskAgain: true }));
  return [
    { granted, canAskAgain: true } as unknown as PermissionReturn[0],
    requestFn as unknown as PermissionReturn[1],
    requestFn as unknown as PermissionReturn[2],
  ] as PermissionReturn;
};

describe("QrScannerModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockUseCameraPermissions.mockReturnValue(createMockPermissionReturn(true));
  });

  it("should render when visible is true", () => {
    renderWithProviders(<QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />);

    expect(screen.getByText("Scan QR code")).toBeOnTheScreen();
  });

  it("should render with custom title", () => {
    renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => { /* noop */ }}
        onScan={() => { /* noop */ }}
        title="Custom Scanner Title"
      />
    );

    expect(screen.getByText("Custom Scanner Title")).toBeOnTheScreen();
  });

  it("should render with default instruction text", () => {
    renderWithProviders(<QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />);

    expect(screen.getByText("Point camera at QR code to scan.")).toBeOnTheScreen();
  });

  it("should render with custom instruction text", () => {
    renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => { /* noop */ }}
        onScan={() => { /* noop */ }}
        instructionText="Custom instructions here"
      />
    );

    expect(screen.getByText("Custom instructions here")).toBeOnTheScreen();
  });

  it("should call onClose when close button is pressed", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(<QrScannerModal visible={true} onClose={onClose} onScan={() => { /* noop */ }} />);

    await user.press(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should render CameraView when permission is granted", () => {
    renderWithProviders(<QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />);

    expect(screen.getByTestId("camera-view")).toBeOnTheScreen();
  });

  it("should render permission request UI when permission is not granted", () => {
    mockUseCameraPermissions.mockReturnValue(createMockPermissionReturn(false));

    renderWithProviders(<QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />);

    expect(screen.getByText("Camera permission is required to scan QR codes.")).toBeOnTheScreen();
    expect(screen.getByText("Grant Permission")).toBeOnTheScreen();
  });

  it("should request permission when Grant Permission button is pressed", async () => {
    const user = userEvent.setup();
    const requestPermission = jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true }));
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true } as unknown as PermissionReturn[0],
      requestPermission as unknown as PermissionReturn[1],
      requestPermission as unknown as PermissionReturn[2],
    ] as PermissionReturn);

    renderWithProviders(<QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />);

    await user.press(screen.getByText("Grant Permission"));
    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalled();
    });
  });

  it("should handle barcode scan and call onScan", async () => {
    const onScan = jest.fn<Promise<void>, [string]>(() => Promise.resolve());
    const onClose = jest.fn();

    renderWithProviders(<QrScannerModal visible={true} onClose={onClose} onScan={onScan} />);

    const cameraView = screen.getByTestId("camera-view");
    const cameraProps = cameraView.props as CameraViewMockProps;
    const barcodeHandler = cameraProps.onBarcodeScanned;

    if (!barcodeHandler) {
      throw new Error("Expected barcode handler to be defined");
    }

    await barcodeHandler({ data: "test-qr-data" });

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledWith("test-qr-data");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should handle scan error and show alert", async () => {
    const onScan = jest.fn<Promise<void>, [string]>(() => Promise.reject(new Error("Invalid QR")));
    const onClose = jest.fn();

    renderWithProviders(<QrScannerModal visible={true} onClose={onClose} onScan={onScan} />);

    const cameraView = screen.getByTestId("camera-view");
    const cameraProps = cameraView.props as CameraViewMockProps;
    const barcodeHandler = cameraProps.onBarcodeScanned;

    if (!barcodeHandler) {
      throw new Error("Expected barcode handler to be defined");
    }

    await barcodeHandler({ data: "invalid-data" });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith("Invalid QR code", "Invalid QR");
    });
  });

  it("should apply correct Modal props", () => {
    renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    const modal = screen.getByTestId("qr-scanner-modal");
    const modalProps = modal.props as React.ComponentProps<typeof Modal>;
    expect(modalProps.animationType).toBe("slide");
    expect(modalProps.visible).toBe(true);
  });

  it("should handle onRequestClose", () => {
    renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    const modal = screen.getByTestId("qr-scanner-modal");
    const modalProps = modal.props as React.ComponentProps<typeof Modal>;
    expect(typeof modalProps.onRequestClose).toBe("function");
  });

  it("should pass correct barcode settings to CameraView", () => {
    renderWithProviders(<QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />);

    const cameraView = screen.getByTestId("camera-view");
    const cameraProps = cameraView.props as CameraViewMockProps;
    expect(cameraProps.facing).toBe("back");
    expect(cameraProps.barcodeScannerSettings).toEqual({ barcodeTypes: ["qr"] });
  });

  it("should disable barcode scanning when scanOncePerSession and already scanned", async () => {
    const onScan = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

    renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={onScan} scanOncePerSession={true} />
    );

    const cameraView = screen.getByTestId("camera-view");
    const cameraProps = cameraView.props as CameraViewMockProps;
    const barcodeHandler = cameraProps.onBarcodeScanned;

    if (!barcodeHandler) {
      throw new Error("Expected barcode handler to be defined");
    }

    await barcodeHandler({ data: "first-scan" });

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledTimes(1);
    });

    const updatedCameraView = screen.getByTestId("camera-view");
    const updatedCameraProps = updatedCameraView.props as CameraViewMockProps;
    expect(updatedCameraProps.onBarcodeScanned).toBeUndefined();
  });

  it("should allow multiple scans when scanOncePerSession is false", async () => {
    const onScan = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

    renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={onScan} scanOncePerSession={false} />
    );

    const cameraView = screen.getByTestId("camera-view");
    const cameraProps = cameraView.props as CameraViewMockProps;
    const barcodeHandler = cameraProps.onBarcodeScanned;

    if (!barcodeHandler) {
      throw new Error("Expected barcode handler to be defined");
    }

    await barcodeHandler({ data: "first-scan" });
    await barcodeHandler({ data: "second-scan" });

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledTimes(2);
    });
  });
});
