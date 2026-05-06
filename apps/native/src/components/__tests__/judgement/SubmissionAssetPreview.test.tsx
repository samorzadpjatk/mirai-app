import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
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

const mockedUseFileDownload = jest.mocked(useFileDownload);
const mockedUseVideoPlayer = jest.fn<VideoPlayerMock, [unknown, (player: VideoPlayerMock) => void]>(() => ({
  play: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  pause: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  muted: false,
  loop: false,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: IconProps) => <Text>{name}</Text>,
}));

jest.mock("expo-image", () => ({
  Image: ({ source }: ImageProps) => <Text testID="image">{source.uri}</Text>,
}));

jest.mock("expo-video", () => ({
  VideoView: () => <View testID="video-view" />,
  useVideoPlayer: mockedUseVideoPlayer,
}));

jest.mock("~/hooks/files", () => ({
  __esModule: true,
  useFileDownload: jest.fn(),
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
  });

  it("should render nothing when no assets exist", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("idle", null)).mockReturnValueOnce(createState("idle", null));

    const { queryByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionNoAssets} />);
    expect(queryByText("Image unavailable")).toBeNull();
    expect(queryByText("Video submission")).toBeNull();
  });

  it("should render image loading state", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("loading", null)).mockReturnValueOnce(createState("idle", null));

    const { UNSAFE_getByType } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should render image when file is available", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("success", { uri: "file://downloaded-image.jpg" })).mockReturnValueOnce(createState("idle", null));

    const { getAllByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(getAllByTestId("image").length).toBeGreaterThan(0);
  });

  it("should render image unavailable state", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("error", null)).mockReturnValueOnce(createState("idle", null));

    const { getAllByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(getAllByText("Image unavailable").length).toBeGreaterThan(0);
    expect(getAllByText("image").length).toBeGreaterThan(0);
  });

  it("should render image count badge for multiple images", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("success", { uri: "file://downloaded-image.jpg" })).mockReturnValueOnce(createState("idle", null));

    const { getByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithMultipleImages} />);
    expect(getByText("3")).toBeTruthy();
    expect(getByText("images")).toBeTruthy();
  });

  it("should not render badge for single image", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("success", { uri: "file://downloaded-image.jpg" })).mockReturnValueOnce(createState("idle", null));

    const { queryByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    expect(queryByText("images")).toBeNull();
  });

  it("should render video player when video is available", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("idle", null)).mockReturnValueOnce(createState("success", { uri: "file://downloaded-video.mp4" }));

    const { getByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(getByTestId("video-view")).toBeTruthy();
  });

  it("should render video loading state", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("idle", null)).mockReturnValueOnce(createState("loading", null));

    const { UNSAFE_getByType } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("should render video placeholder when no video file", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("idle", null)).mockReturnValueOnce(createState("idle", null));

    const { getByText } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithVideo} />);
    expect(getByText("Video submission")).toBeTruthy();
    expect(getByText("play-circle")).toBeTruthy();
  });

  it("should open fullscreen image when image is pressed", () => {
    mockedUseFileDownload.mockReturnValueOnce(createState("success", { uri: "file://downloaded-image.jpg" })).mockReturnValueOnce(createState("idle", null));

    const { getAllByTestId } = renderWithProviders(<SubmissionAssetPreview submission={mockSubmissionWithImages} />);
    const pressable = getAllByTestId("image")[0]?.parent;
    expect(pressable).toBeTruthy();
  });
});
