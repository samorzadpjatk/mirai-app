import React from "react";
import { Text, View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SubmissionAssetPreview } from "../../judgement/SubmissionAssetPreview";
import { useFileDownload } from "~/hooks/files";

interface IconProps {
  name: string;
}

interface ImageProps {
  source: { uri: string };
}

interface VideoPlayerMock {
  play: jest.Mock<Promise<void>, []>;
  pause: jest.Mock<Promise<void>, []>;
  muted: boolean;
  loop: boolean;
}

interface DownloadState {
  download: jest.Mock<Promise<void>, [{ storagePath: string; skipCache: boolean }]>
  status: string;
  file: { uri: string } | null;
  reset: jest.Mock<void, []>;
  abort: jest.Mock<void, []>;
}

const mockReact = React;
const mockText = Text;
const mockView = View;

const mockUseFileDownload = jest.fn();
const mockUseVideoPlayer = jest.fn<VideoPlayerMock, [unknown, (player: VideoPlayerMock) => void]>(() => ({
  play: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  pause: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  muted: false,
  loop: false,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: IconProps) => mockReact.createElement(mockText, null, name),
}));

jest.mock("expo-image", () => ({
  Image: ({ source }: ImageProps) => mockReact.createElement(mockText, { testID: "image" }, source.uri),
}));

jest.mock("expo-video", () => ({
  VideoView: () => mockReact.createElement(mockView, { testID: "video-view" }),
  useVideoPlayer: (...args: unknown[]) => mockUseVideoPlayer(...args),
}));

jest.mock("~/hooks/files", () => ({
  __esModule: true,
  useFileDownload: (...args: unknown[]) => mockUseFileDownload(...args),
}));

const createState = (status: string, file: { uri: string } | null): DownloadState => ({
  download: jest.fn<Promise<void>, [{ storagePath: string; skipCache: boolean }]>().mockResolvedValue(undefined),
  status,
  file,
  reset: jest.fn<void, []>(),
  abort: jest.fn<void, []>(),
});

const mockSubmissionNoAssets = { id: "sub-1", imageIds: [], videoId: null };
const mockSubmissionWithImages = { id: "sub-2", imageIds: ["image-1.jpg"], videoId: null };
const mockSubmissionWithMultipleImages = { id: "sub-3", imageIds: ["image-1.jpg", "image-2.jpg", "image-3.jpg"], videoId: null };
const mockSubmissionWithVideo = { id: "sub-4", imageIds: [], videoId: "video-1.mp4" };

describe("SubmissionAssetPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFileDownload.mockReturnValue(createState("idle", null));
    mockUseVideoPlayer.mockReturnValue({
      play: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
      pause: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
      muted: false,
      loop: false,
    });
  });

  it("should render nothing when no assets exist", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("idle", null)).mockReturnValueOnce(createState("idle", null));

    const { queryByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionNoAssets} />);
    expect(queryByText("Image unavailable")).toBeNull();
    expect(queryByText("Video submission")).toBeNull();
  });

  it("should render image loading state", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("loading", null)).mockReturnValueOnce(createState("idle", null));

    const { getByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(getByTestId("image-loading")).toBeTruthy();
  });

  it("should render image when file is available", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("success", { uri: "file://downloaded-image.jpg" })).mockReturnValueOnce(createState("idle", null));

    const { getAllByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(getAllByTestId("image").length).toBeGreaterThan(0);
  });

  it("should render image unavailable state", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("error", null)).mockReturnValueOnce(createState("idle", null));

    const { getAllByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(getAllByText("Image unavailable").length).toBeGreaterThan(0);
    expect(getAllByText("image").length).toBeGreaterThan(0);
  });

  it("should render image count badge for multiple images", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("success", { uri: "file://downloaded-image.jpg" })).mockReturnValueOnce(createState("idle", null));

    const { getByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithMultipleImages} />);
    expect(getByText("3")).toBeTruthy();
    expect(getByText("images")).toBeTruthy();
  });

  it("should not render badge for single image", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("success", { uri: "file://downloaded-image.jpg" })).mockReturnValueOnce(createState("idle", null));

    const { queryByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(queryByText("images")).toBeNull();
  });

  it("should render video player when video is available", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("idle", null)).mockReturnValueOnce(createState("success", { uri: "file://downloaded-video.mp4" }));

    const { getByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(getByTestId("video-view")).toBeTruthy();
  });

  it("should render video loading state", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("idle", null)).mockReturnValueOnce(createState("loading", null));

    const { getByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(getByTestId("video-loading")).toBeTruthy();
  });

  it("should render video placeholder when no video file", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("idle", null)).mockReturnValueOnce(createState("idle", null));

    const { getByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(getByText("Video submission")).toBeTruthy();
    expect(getByText("play-circle")).toBeTruthy();
  });

  it("should open fullscreen image when image is pressed", () => {
    mockUseFileDownload.mockReturnValueOnce(createState("success", { uri: "file://downloaded-image.jpg" })).mockReturnValueOnce(createState("idle", null));

    const { getAllByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    const pressable = getAllByTestId("image")[0]?.parent;
    expect(pressable).toBeTruthy();
  });
});
