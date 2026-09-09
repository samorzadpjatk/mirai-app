import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Text, View } from "react-native";
import { SubmissionVideoPlayer } from "../../common/SubmissionVideoPlayer";
import { renderWithProviders } from "../helpers/renderWithProviders";

interface VideoPlayerMock {
  play: jest.Mock<() => Promise<void>>;
  pause: jest.Mock<() => Promise<void>>;
  muted: boolean;
  loop: boolean;
}

interface DownloadState {
  download: jest.Mock<(input: { storagePath: string; skipCache: boolean }) => Promise<void>>;
  status: string;
  file: { uri: string } | null;
  reset: jest.Mock<() => void>;
  abort: jest.Mock<() => void>;
}

const mockReact = React;
const mockText = Text;
const mockView = View;

const mockUseFileDownload = jest.fn<() => DownloadState>();
const mockUseVideoPlayer = jest.fn<() => VideoPlayerMock>();

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => mockReact.createElement(mockText, null, name),
}));

jest.mock("expo-video", () => ({
  VideoView: () => mockReact.createElement(mockView, { testID: "video-view" }),
  useVideoPlayer: () => mockUseVideoPlayer(),
}));

jest.mock("~/hooks/files", () => ({
  __esModule: true,
  useFileDownload: () => mockUseFileDownload(),
}));

const createState = (status: string, file: { uri: string } | null): DownloadState => ({
  download: jest
    .fn<(input: { storagePath: string; skipCache: boolean }) => Promise<void>>()
    .mockResolvedValue(undefined),
  status,
  file,
  reset: jest.fn<() => void>(),
  abort: jest.fn<() => void>(),
});

describe("SubmissionVideoPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFileDownload.mockReturnValue(createState("idle", null));
    mockUseVideoPlayer.mockReturnValue({
      play: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      pause: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      muted: false,
      loop: false,
    });
  });

  it("renders nothing without a storage path", () => {
    const { queryByTestId } = renderWithProviders(<SubmissionVideoPlayer storagePath={null} />);

    expect(queryByTestId("submission-video-player")).toBeNull();
  });

  it("renders the placeholder before the video is downloaded", () => {
    const { getByText } = renderWithProviders(<SubmissionVideoPlayer storagePath="videos/1.mp4" />);

    expect(getByText("Video submission")).toBeTruthy();
    expect(getByText("play-circle")).toBeTruthy();
  });

  it("renders the loading state while downloading", () => {
    mockUseFileDownload.mockReturnValue(createState("loading", null));

    const { getByTestId, getByText } = renderWithProviders(
      <SubmissionVideoPlayer storagePath="videos/1.mp4" />,
    );

    expect(getByTestId("video-loading")).toBeTruthy();
    expect(getByText("Loading video")).toBeTruthy();
  });

  it("renders the player once the file is downloaded", () => {
    mockUseFileDownload.mockReturnValue(createState("success", { uri: "file://video.mp4" }));

    const { getByTestId, queryByText } = renderWithProviders(
      <SubmissionVideoPlayer storagePath="videos/1.mp4" />,
    );

    expect(getByTestId("video-view")).toBeTruthy();
    expect(queryByText("Video submission")).toBeNull();
  });
});
