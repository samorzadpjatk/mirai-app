import React from "react";
import { Modal, Pressable, Text, View, Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { QrScannerModal } from "../../common/QrScannerModal";

jest.mock("expo-camera", () => ({
  CameraView: "CameraView",
  useCameraPermissions: jest.fn(),
}));

const mockUseCameraPermissions = jest.requireMock("expo-camera").useCameraPermissions;

describe("QrScannerModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true },
      jest.fn(() => Promise.resolve({ granted: true })),
    ]);
  });

  it("should render when visible is true", () => {
    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
      />
    );

    expect(getByText("Scan QR code")).toBeTruthy();
  });

  it("should render with custom title", () => {
    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
        title="Custom Scanner Title"
      />
    );

    expect(getByText("Custom Scanner Title")).toBeTruthy();
  });

  it("should render with default instruction text", () => {
    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
      />
    );

    expect(getByText("Point camera at QR code to scan.")).toBeTruthy();
  });

  it("should render with custom instruction text", () => {
    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
        instructionText="Custom instructions here"
      />
    );

    expect(getByText("Custom instructions here")).toBeTruthy();
  });

  it("should call onClose when close button is pressed", () => {
    const onClose = jest.fn();
    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={onClose}
        onScan={() => {}}
      />
    );

    fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should render CameraView when permission is granted", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
      />
    );

    const cameraView = UNSAFE_getByType("CameraView");
    expect(cameraView).toBeTruthy();
  });

  it("should render permission request UI when permission is not granted", () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: false },
      jest.fn(() => Promise.resolve({ granted: true })),
    ]);

    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
      />
    );

    expect(getByText("Camera permission is required to scan QR codes.")).toBeTruthy();
    expect(getByText("Grant Permission")).toBeTruthy();
  });

  it("should request permission when Grant Permission button is pressed", async () => {
    const requestPermission = jest.fn(() => Promise.resolve({ granted: true }));
    mockUseCameraPermissions.mockReturnValue([
      { granted: false },
      requestPermission,
    ]);

    const { getByText } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
      />
    );

    fireEvent.press(getByText("Grant Permission"));
    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalled();
    });
  });

  it("should handle barcode scan and call onScan", async () => {
    const onScan = jest.fn(() => Promise.resolve());
    const onClose = jest.fn();
    
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={onClose}
        onScan={onScan}
      />
    );

    const cameraView = UNSAFE_getByType("CameraView");
    const barcodeHandler = cameraView.props.onBarcodeScanned;
    
    await barcodeHandler({ data: "test-qr-data" });
    
    await waitFor(() => {
      expect(onScan).toHaveBeenCalledWith("test-qr-data");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should handle scan error and show alert", async () => {
    const onScan = jest.fn(() => Promise.reject(new Error("Invalid QR")));
    const onClose = jest.fn();
    
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={onClose}
        onScan={onScan}
      />
    );

    const cameraView = UNSAFE_getByType("CameraView");
    const barcodeHandler = cameraView.props.onBarcodeScanned;
    
    await barcodeHandler({ data: "invalid-data" });
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith("Invalid QR code", "Invalid QR");
    });
  });

  it("should apply correct Modal props", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
      />
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.animationType).toBe("slide");
    expect(modal.props.visible).toBe(true);
  });

  it("should handle onRequestClose", () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={onClose}
        onScan={() => {}}
      />
    );

    const modal = UNSAFE_getByType(Modal);
    expect(typeof modal.props.onRequestClose).toBe("function");
  });

  it("should pass correct barcode settings to CameraView", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={() => {}}
      />
    );

    const cameraView = UNSAFE_getByType("CameraView");
    expect(cameraView.props.facing).toBe("back");
    expect(cameraView.props.barcodeScannerSettings).toEqual({ barcodeTypes: ["qr"] });
  });

  it("should disable barcode scanning when scanOncePerSession and already scanned", async () => {
    const onScan = jest.fn(() => Promise.resolve());
    
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={onScan}
        scanOncePerSession={true}
      />
    );

    const cameraView = UNSAFE_getByType("CameraView");
    
    await cameraView.props.onBarcodeScanned({ data: "first-scan" });
    
    await waitFor(() => {
      expect(onScan).toHaveBeenCalledTimes(1);
    });

    const updatedCameraView = UNSAFE_getByType("CameraView");
    expect(updatedCameraView.props.onBarcodeScanned).toBeUndefined();
  });

  it("should allow multiple scans when scanOncePerSession is false", async () => {
    const onScan = jest.fn(() => Promise.resolve());
    
    const { UNSAFE_getByType } = renderWithProviders(
      <QrScannerModal
        visible={true}
        onClose={() => {}}
        onScan={onScan}
        scanOncePerSession={false}
      />
    );

    const cameraView = UNSAFE_getByType("CameraView");
    
    await cameraView.props.onBarcodeScanned({ data: "first-scan" });
    await cameraView.props.onBarcodeScanned({ data: "second-scan" });
    
    await waitFor(() => {
      expect(onScan).toHaveBeenCalledTimes(2);
    });
  });
});
