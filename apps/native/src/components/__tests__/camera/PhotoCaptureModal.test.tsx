import { act, fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text, View } from "react-native";
import {
  buildLensPresetOptions,
  PhotoCaptureModal,
  toLensPreset,
} from "~/components/camera/PhotoCaptureModal";
import { renderWithProviders } from "../helpers/renderWithProviders";

interface TakePictureOptions {
  quality: number;
  exif: boolean;
  mirror: boolean;
  skipProcessing: boolean;
}

interface CapturedPicture {
  uri: string;
  format: "jpeg" | "png";
}

interface CameraViewHandle {
  takePictureAsync: (options: TakePictureOptions) => Promise<CapturedPicture>;
}

interface CameraViewProps {
  testID?: string;
}

interface AppModalShellProps {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

type UsePhotoHandler = (photo: {
  uri: string;
  mimeType: "image/jpeg" | "image/png";
}) => Promise<void> | void;

const mockTakePictureAsync: jest.MockedFunction<
  (options: TakePictureOptions) => Promise<CapturedPicture>
> = jest.fn();
const mockOnUsePhoto: jest.MockedFunction<UsePhotoHandler> = jest.fn();
const mockOnClose = jest.fn<void, []>();

jest.mock("expo-camera", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockCameraView = React.forwardRef(function MockCameraView(
    _props: CameraViewProps,
    ref: React.Ref<CameraViewHandle>,
  ): React.ReactElement {
    React.useImperativeHandle(
      ref,
      () => ({
        takePictureAsync: mockTakePictureAsync,
      }),
      [],
    );

    return React.createElement(View, { testID: "camera-view" });
  });

  return {
    CameraView: MockCameraView,
  };
});

describe("PhotoCaptureModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTakePictureAsync.mockResolvedValue({
      uri: "file:///test/photo.jpg",
      format: "jpeg",
    });
    mockOnUsePhoto.mockResolvedValue(undefined);
  });

  const defaultProps = {
    visible: true,
    title: "Take Photo",
    onClose: mockOnClose,
    onUsePhoto: mockOnUsePhoto,
    isUsingPhoto: false,
    facing: "front" as const,
    quality: 0.85,
  };

  describe("rendering", () => {
    it("should render modal with title", () => {
      const { getByText } = renderWithProviders(<PhotoCaptureModal {...defaultProps} />);
      expect(getByText("Take Photo")).toBeOnTheScreen();
    });

    it("should not render when not visible", () => {
      const { queryByTestId } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} visible={false} />,
      );
      expect(queryByTestId("app-modal")).toBeNull();
    });

    it("should render camera view when visible", () => {
      const { getByTestId } = renderWithProviders(<PhotoCaptureModal {...defaultProps} />);
      expect(getByTestId("camera-view")).toBeTruthy();
    });
  });

  describe("camera capture", () => {
    it("should capture photo when button is pressed", async () => {
      const { getByText } = renderWithProviders(<PhotoCaptureModal {...defaultProps} />);

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(mockTakePictureAsync).toHaveBeenCalledWith({
          quality: 0.85,
          exif: true,
          mirror: false,
          skipProcessing: false,
        });
      });
    });

    it("should show captured photo preview after capture", async () => {
      mockTakePictureAsync.mockResolvedValue({
        uri: "file:///test/photo.jpg",
        format: "jpeg",
      });

      const { getByText, queryByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} />,
      );

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(queryByText("camera")).toBeNull();
        expect(getByText("Retake")).toBeTruthy();
        expect(getByText("Use Photo")).toBeTruthy();
      });
    });

    it("should return to camera when retake is pressed", async () => {
      mockTakePictureAsync.mockResolvedValue({
        uri: "file:///test/photo.jpg",
        format: "jpeg",
      });

      const { getByText, queryByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} />,
      );

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(getByText("Retake")).toBeTruthy();
      });

      fireEvent.press(getByText("Retake"));

      await waitFor(() => {
        expect(queryByText("Retake")).toBeNull();
        expect(getByText("camera")).toBeTruthy();
      });
    });

    it("should call onUsePhoto when use photo is pressed", async () => {
      mockTakePictureAsync.mockResolvedValue({
        uri: "file:///test/photo.jpg",
        format: "jpeg",
      });

      const { getByText } = renderWithProviders(<PhotoCaptureModal {...defaultProps} />);

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(getByText("Use Photo")).toBeTruthy();
      });

      fireEvent.press(getByText("Use Photo"));

      await waitFor(() => {
        expect(mockOnUsePhoto).toHaveBeenCalledWith(
          expect.objectContaining({
            mimeType: "image/jpeg",
          }),
        );
      });

      const capturedPhoto = mockOnUsePhoto.mock.calls[0]?.[0];
      expect(capturedPhoto?.uri).toEqual(expect.any(String));
    });

    it("should handle PNG format", async () => {
      mockTakePictureAsync.mockResolvedValue({
        uri: "file:///test/photo.png",
        format: "png",
      });

      const { getByText } = renderWithProviders(<PhotoCaptureModal {...defaultProps} />);

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(getByText("Use Photo")).toBeTruthy();
      });

      fireEvent.press(getByText("Use Photo"));

      await waitFor(() => {
        expect(mockOnUsePhoto).toHaveBeenCalledWith(
          expect.objectContaining({
            mimeType: "image/png",
          }),
        );
      });
    });

    it("should handle quality prop", async () => {
      const { getByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} quality={0.5} />,
      );

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(mockTakePictureAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            quality: 0.5,
          }),
        );
      });
    });

    it("should handle default quality when not specified", async () => {
      const { getByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} quality={undefined} />,
      );

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(mockTakePictureAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            quality: 0.85,
          }),
        );
      });
    });
  });

  describe("modal lifecycle", () => {
    it("should reset state when modal is closed", async () => {
      mockTakePictureAsync.mockResolvedValue({
        uri: "file:///test/photo.jpg",
        format: "jpeg",
      });

      const { getByText, queryByText, rerender } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} />,
      );

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(getByText("Retake")).toBeTruthy();
      });

      rerender(<PhotoCaptureModal {...defaultProps} visible={false} />);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      rerender(<PhotoCaptureModal {...defaultProps} visible={true} />);

      await waitFor(() => {
        expect(queryByText("Retake")).toBeNull();
        expect(getByText("camera")).toBeTruthy();
      });
    });
  });

  describe("lens preset functions", () => {
    it("toLensPreset should map ultrawide to 0.5x", () => {
      expect(toLensPreset("ultrawide")).toBe("0.5x");
      expect(toLensPreset("UltraWide")).toBe("0.5x");
    });

    it("toLensPreset should map telephoto to 2x", () => {
      expect(toLensPreset("telephoto")).toBe("2x");
      expect(toLensPreset("TelePhoto")).toBe("2x");
    });

    it("toLensPreset should map wide angles to 1x", () => {
      expect(toLensPreset("wideangle")).toBe("1x");
      expect(toLensPreset("dualwide")).toBe("1x");
      expect(toLensPreset("triple")).toBe("1x");
      expect(toLensPreset("dual")).toBe("1x");
      expect(toLensPreset("truedepth")).toBe("1x");
      expect(toLensPreset("front")).toBe("1x");
      expect(toLensPreset("wide")).toBe("1x");
    });

    it("toLensPreset should return null for unknown lenses", () => {
      expect(toLensPreset("macro")).toBeNull();
      expect(toLensPreset("unknown")).toBeNull();
    });

    it("buildLensPresetOptions should build options from lenses", () => {
      const lenses = ["ultrawide", "wideangle", "telephoto"];
      const options = buildLensPresetOptions(lenses);
      expect(options).toHaveLength(3);
      expect(options[0]).toEqual({ label: "0.5x", lens: "ultrawide" });
      expect(options[1]).toEqual({ label: "1x", lens: "wideangle" });
      expect(options[2]).toEqual({ label: "2x", lens: "telephoto" });
    });

    it("buildLensPresetOptions should deduplicate by preset", () => {
      const lenses = ["ultrawide", "ultrawide2", "wideangle", "wideangle2"];
      const options = buildLensPresetOptions(lenses);
      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({ label: "0.5x", lens: "ultrawide" });
      expect(options[1]).toEqual({ label: "1x", lens: "wideangle" });
    });

    it("buildLensPresetOptions should filter unknown lenses", () => {
      const lenses = ["ultrawide", "macro", "unknown"];
      const options = buildLensPresetOptions(lenses);
      expect(options).toHaveLength(1);
      expect(options[0]).toEqual({ label: "0.5x", lens: "ultrawide" });
    });

    it("buildLensPresetOptions should return empty array for empty input", () => {
      expect(buildLensPresetOptions([])).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("should handle capture when camera ref is null", async () => {
      const { getByText } = renderWithProviders(<PhotoCaptureModal {...defaultProps} />);
      act(() => {
        fireEvent.press(getByText("camera"));
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
    });

    it("should handle use photo when no photo is captured", async () => {
      const { queryByText } = renderWithProviders(<PhotoCaptureModal {...defaultProps} />);
      expect(queryByText("Use Photo")).toBeNull();
    });

    it("should handle isUsingPhoto state", async () => {
      mockTakePictureAsync.mockResolvedValue({
        uri: "file:///test/photo.jpg",
        format: "jpeg",
      });

      const { getByText, queryByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} isUsingPhoto={true} />,
      );

      act(() => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(getByText("Retake")).toBeTruthy();
      });

      expect(queryByText("Use Photo")).toBeNull();
      expect(mockOnUsePhoto).not.toHaveBeenCalled();
    });
  });
});
