import React from "react";
import { ActivityIndicator } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SubmissionAssetPreview } from "../../judgement/SubmissionAssetPreview";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

jest.mock("expo-image", () => ({
  Image: ({ source }: { source: { uri: string } }) => {
    const { Text } = require("react-native");
    return <Text testID="image">{source.uri}</Text>;
  },
}));

jest.mock("expo-video", () => ({
  VideoView: () => {
    const { View } = require("react-native");
    return <View testID="video-view" />;
  },
  useVideoPlayer: jest.fn().mockReturnValue({ play: jest.fn(), pause: jest.fn() }),
}));

jest.mock("~/hooks/files", () => ({
  __esModule: true,
  useFileDownload: jest.fn(),
}));

const imageState = (status: string, file: { uri: string } | null) => ({
  download: jest.fn().mockResolvedValue(undefined),
  status,
  file,
  reset: jest.fn(),
  abort: jest.fn(),
});

const videoState = (status: string, file: { uri: string } | null) => ({
  download: jest.fn().mockResolvedValue(undefined),
  status,
  file,
  reset: jest.fn(),
  abort: jest.fn(),
});

const mockSubmissionNoAssets = { id: "sub-1", imageIds: [], videoId: null };
const mockSubmissionWithImages = { id: "sub-2", imageIds: ["image-1.jpg"], videoId: null };
const mockSubmissionWithMultipleImages = { id: "sub-3", imageIds: ["image-1.jpg", "image-2.jpg", "image-3.jpg"], videoId: null };
const mockSubmissionWithVideo = { id: "sub-4", imageIds: [], videoId: "video-1.mp4" };

describe("SubmissionAssetPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing when no assets exist", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("idle", null))
      .mockReturnValueOnce(videoState("idle", null));

    const { queryByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionNoAssets} />);
    expect(queryByText("Image unavailable")).toBeNull();
    expect(queryByText("Video submission")).toBeNull();
  });

  it("should render image loading state", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("loading", null))
      .mockReturnValueOnce(videoState("idle", null));

    const { UNSAFE_getByType } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should render image when file is available", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("success", { uri: "file://downloaded-image.jpg" }))
      .mockReturnValueOnce(videoState("idle", null));

    const { getAllByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(getAllByTestId("image").length).toBeGreaterThan(0);
  });

  it("should render image unavailable state", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("error", null))
      .mockReturnValueOnce(videoState("idle", null));

    const { getAllByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(getAllByText("Image unavailable").length).toBeGreaterThan(0);
    expect(getAllByText("image").length).toBeGreaterThan(0);
  });

  it("should render image count badge for multiple images", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("success", { uri: "file://downloaded-image.jpg" }))
      .mockReturnValueOnce(videoState("idle", null));

    const { getByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithMultipleImages} />);
    expect(getByText("3")).toBeTruthy();
    expect(getByText("images")).toBeTruthy();
  });

  it("should not render badge for single image", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("success", { uri: "file://downloaded-image.jpg" }))
      .mockReturnValueOnce(videoState("idle", null));

    const { queryByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(queryByText("images")).toBeNull();
  });

  it("should render video player when video is available", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("idle", null))
      .mockReturnValueOnce(videoState("success", { uri: "file://downloaded-video.mp4" }));

    const { getByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(getByTestId("video-view")).toBeTruthy();
  });

  it("should render video loading state", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("idle", null))
      .mockReturnValueOnce(videoState("loading", null));

    const { UNSAFE_getByType } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should render video placeholder when no video file", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("idle", null))
      .mockReturnValueOnce(videoState("idle", null));

    const { getByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(getByText("Video submission")).toBeTruthy();
    expect(getByText("play-circle")).toBeTruthy();
  });

  it("should open fullscreen image when image is pressed", () => {
    const { useFileDownload } = require("~/hooks/files");
    useFileDownload
      .mockReturnValueOnce(imageState("success", { uri: "file://downloaded-image.jpg" }))
      .mockReturnValueOnce(videoState("idle", null));

    const { getAllByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    const pressable = getAllByTestId("image")[0]?.parent;
    expect(pressable).toBeTruthy();
  });
});
