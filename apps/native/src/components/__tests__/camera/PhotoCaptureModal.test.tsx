import React from "react";
import { Text, View } from "react-native";
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { PhotoCaptureModal } from "~/components/camera/PhotoCaptureModal";

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
});
