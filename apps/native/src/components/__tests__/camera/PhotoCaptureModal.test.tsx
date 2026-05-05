import React from "react";
import { Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { fireEvent, waitFor, act } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";

const mockTakePictureAsync = jest.fn();

jest.mock("expo-camera", () => ({
  CameraView: function CameraView(props: any) {
    const React = require("react");
    const { View } = require("react-native");

    React.useImperativeHandle(
      props.ref,
      () => ({
        takePictureAsync: mockTakePictureAsync,
      }),
      []
    );

    return React.createElement(View, {
      testID: "camera-view",
      ...props,
    });
  },
}));

jest.mock("~/components/common/ui", () => ({
  AppModalShell: ({
    visible,
    title,
    children,
    onClose,
  }: {
    visible: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) => {
    const React = require("react");
    const { View, Text } = require("react-native");
    if (!visible) return null;
    return React.createElement(
      View,
      { testID: "modal-shell" },
      React.createElement(Text, { testID: "modal-title" }, title),
      children
    );
  },
}));

const { PhotoCaptureModal } = require("~/components/camera/PhotoCaptureModal");

describe("PhotoCaptureModal", () => {
  const mockOnClose = jest.fn();
  const mockOnUsePhoto = jest.fn();

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
      const { getByTestId } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} />
      );
      expect(getByTestId("modal-title").children[0]).toBe("Take Photo");
    });

    it("should not render when not visible", () => {
      const { queryByTestId } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} visible={false} />
      );
      expect(queryByTestId("modal-shell")).toBeNull();
    });

    it("should render camera view when visible", () => {
      const { getByTestId } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} />
      );
      expect(getByTestId("camera-view")).toBeTruthy();
    });
  });

  describe("camera capture", () => {
    it("should capture photo when button is pressed", async () => {
      const { getByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} />
      );

      await act(async () => {
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
        <PhotoCaptureModal {...defaultProps} />
      );

      await act(async () => {
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
        <PhotoCaptureModal {...defaultProps} />
      );

      await act(async () => {
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

      const { getByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} />
      );

      await act(async () => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(getByText("Use Photo")).toBeTruthy();
      });

      fireEvent.press(getByText("Use Photo"));

      await waitFor(() => {
        expect(mockOnUsePhoto).toHaveBeenCalledWith({
          uri: expect.any(String),
          mimeType: "image/jpeg",
        });
      });
    });

    it("should handle PNG format", async () => {
      mockTakePictureAsync.mockResolvedValue({
        uri: "file:///test/photo.png",
        format: "png",
      });

      const { getByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} />
      );

      await act(async () => {
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
          })
        );
      });
    });

    it("should handle quality prop", async () => {
      const { getByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} quality={0.5} />
      );

      await act(async () => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(mockTakePictureAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            quality: 0.5,
          })
        );
      });
    });

    it("should handle default quality when not specified", async () => {
      const { getByText } = renderWithProviders(
        <PhotoCaptureModal {...defaultProps} quality={undefined} />
      );

      await act(async () => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(mockTakePictureAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            quality: 0.85,
          })
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
        <PhotoCaptureModal {...defaultProps} />
      );

      await act(async () => {
        fireEvent.press(getByText("camera"));
      });

      await waitFor(() => {
        expect(getByText("Retake")).toBeTruthy();
      });

      rerender(<PhotoCaptureModal {...defaultProps} visible={false} />);
      rerender(<PhotoCaptureModal {...defaultProps} visible={true} />);

      await waitFor(() => {
        expect(queryByText("Retake")).toBeNull();
        expect(getByText("camera")).toBeTruthy();
      });
    });
  });
});
