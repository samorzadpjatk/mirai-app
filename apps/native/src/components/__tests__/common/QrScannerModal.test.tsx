import React from "react";
import { Alert, Modal, View } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { useCameraPermissions } from "expo-camera";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { QrScannerModal } from "../../common/QrScannerModal";

interface CameraPermission {
  granted: boolean;
}

interface BarcodeScannedEvent {
  data: string;
}

interface CameraViewMockProps {
  facing: "back" | "front";
  barcodeScannerSettings: { barcodeTypes: "qr"[] };
  onBarcodeScanned?: (event: BarcodeScannedEvent) => void | Promise<void>;
}

const MockCameraView = ({ facing, barcodeScannerSettings, onBarcodeScanned }: CameraViewMockProps) =>
  React.createElement(View, {
    testID: "camera-view",
    facing,
    barcodeScannerSettings,
    onBarcodeScanned,
  });

jest.mock("expo-camera", () => ({
  CameraView: MockCameraView,
  useCameraPermissions: jest.fn(),
}));

const mockUseCameraPermissions = useCameraPermissions as jest.MockedFunction<typeof useCameraPermissions>;
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

const createPermissionRequest = () => jest.fn<Promise<CameraPermission>, []>(() => Promise.resolve({ granted: true }));

describe("QrScannerModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, createPermissionRequest()] as ReturnType<
      typeof useCameraPermissions
    >);
  });

  it("should render when visible is true", () => {
    const { getByText } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    expect(getByText("Scan QR code")).toBeTruthy();
  });

  it("should render with custom title", () => {
    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => { /* noop */ }}
        onScan={() => { /* noop */ }}
        title="Custom Scanner Title"
      />
    );

    expect(getByText("Custom Scanner Title")).toBeTruthy();
  });

  it("should render with default instruction text", () => {
    const { getByText } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    expect(getByText("Point camera at QR code to scan.")).toBeTruthy();
  });

  it("should render with custom instruction text", () => {
    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => { /* noop */ }}
        onScan={() => { /* noop */ }}
        instructionText="Custom instructions here"
      />
    );

    expect(getByText("Custom instructions here")).toBeTruthy();
  });

  it("should call onClose when close button is pressed", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <QrScannerModal visible={true} onClose={onClose} onScan={() => { /* noop */ }} />
    );

    fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should render CameraView when permission is granted", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    const cameraView = UNSAFE_getByType(MockCameraView);
    expect(cameraView).toBeTruthy();
  });

  it("should render permission request UI when permission is not granted", () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: false }, createPermissionRequest()] as ReturnType<
      typeof useCameraPermissions
    >);

    const { getByText } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    expect(getByText("Camera permission is required to scan QR codes.")).toBeTruthy();
    expect(getByText("Grant Permission")).toBeTruthy();
  });

  it("should request permission when Grant Permission button is pressed", async () => {
    const requestPermission = createPermissionRequest();
    mockUseCameraPermissions.mockReturnValue([{ granted: false }, requestPermission] as ReturnType<
      typeof useCameraPermissions
    >);

    const { getByText } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    fireEvent.press(getByText("Grant Permission"));
    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalled();
    });
  });

  it("should handle barcode scan and call onScan", async () => {
    const onScan = jest.fn<Promise<void>, [string]>(() => Promise.resolve());
    const onClose = jest.fn();

    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal visible={true} onClose={onClose} onScan={onScan} />
    );

    const cameraView = UNSAFE_getByType(MockCameraView);
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

    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal visible={true} onClose={onClose} onScan={onScan} />
    );

    const cameraView = UNSAFE_getByType(MockCameraView);
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
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    const modal = UNSAFE_getByType(Modal);
    const modalProps = modal.props as React.ComponentProps<typeof Modal>;
    expect(modalProps.animationType).toBe("slide");
    expect(modalProps.visible).toBe(true);
  });

  it("should handle onRequestClose", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    const modal = UNSAFE_getByType(Modal);
    const modalProps = modal.props as React.ComponentProps<typeof Modal>;
    expect(typeof modalProps.onRequestClose).toBe("function");
  });

  it("should pass correct barcode settings to CameraView", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={() => { /* noop */ }} />
    );

    const cameraView = UNSAFE_getByType(MockCameraView);
    const cameraProps = cameraView.props as CameraViewMockProps;
    expect(cameraProps.facing).toBe("back");
    expect(cameraProps.barcodeScannerSettings).toEqual({ barcodeTypes: ["qr"] });
  });

  it("should disable barcode scanning when scanOncePerSession and already scanned", async () => {
    const onScan = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={onScan} scanOncePerSession={true} />
    );

    const cameraView = UNSAFE_getByType(MockCameraView);
    const cameraProps = cameraView.props as CameraViewMockProps;
    const barcodeHandler = cameraProps.onBarcodeScanned;

    if (!barcodeHandler) {
      throw new Error("Expected barcode handler to be defined");
    }

    await barcodeHandler({ data: "first-scan" });

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledTimes(1);
    });

    const updatedCameraView = UNSAFE_getByType(MockCameraView);
    const updatedCameraProps = updatedCameraView.props as CameraViewMockProps;
    expect(updatedCameraProps.onBarcodeScanned).toBeUndefined();
  });

  it("should allow multiple scans when scanOncePerSession is false", async () => {
    const onScan = jest.fn<Promise<void>, [string]>(() => Promise.resolve());

    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal visible={true} onClose={() => { /* noop */ }} onScan={onScan} scanOncePerSession={false} />
    );

    const cameraView = UNSAFE_getByType(MockCameraView);
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
