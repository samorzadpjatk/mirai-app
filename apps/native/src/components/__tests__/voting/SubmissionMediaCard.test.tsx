import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { SubmissionMediaCard } from "~/components/voting/SubmissionMediaCard";
import type { VotingSubmission } from "~/hooks/voting/useVotingDeck";
import { createORPCHandler, server } from "~/test-utils/msw/server";
import { renderWithMSW } from "~/test-utils/msw/test-wrapper";

const mockReact = React;
const mockText = Text;

jest.mock("~/components/common/SubmissionVideoPlayer", () => ({
  __esModule: true,
  SubmissionVideoPlayer: ({ storagePath }: { storagePath?: string | null }) =>
    mockReact.createElement(mockText, { testID: "submission-video-player" }, storagePath ?? ""),
}));

describe("SubmissionMediaCard", () => {
  const mockSubmission: VotingSubmission = {
    id: "submission-1",
    groupId: "group-1",
    imagePath: "submission-images/group-a.jpg",
    videoPath: null,
    groupName: "Group A",
    createdAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  it("renders the title and group name", async () => {
    server.use(
      createORPCHandler(["storage", "createDownloadUrl"], () => ({
        signedUrl: "https://example.com/image.jpg",
      })),
    );
    const { getByText } = renderWithMSW(
      <SubmissionMediaCard submission={mockSubmission} title="Submission" />,
    );
    await waitFor(() => expect(getByText("Submission")).toBeTruthy());
    await waitFor(() => expect(getByText("Group A")).toBeTruthy());
  });

  it("calls onPress when pressed", async () => {
    server.use(
      createORPCHandler(["storage", "createDownloadUrl"], () => ({
        signedUrl: "https://example.com/image.jpg",
      })),
    );
    const onPress = jest.fn();
    const { getByText } = renderWithMSW(
      <SubmissionMediaCard submission={mockSubmission} title="Submission" onPress={onPress} />,
    );
    await waitFor(() => expect(getByText("Submission")).toBeTruthy());
    fireEvent.press(getByText("Submission"));
    await waitFor(() => expect(onPress).toHaveBeenCalled());
  });

  it("shows a fallback initial when the image is unavailable", async () => {
    server.use(
      createORPCHandler(["storage", "createDownloadUrl"], () => ({
        signedUrl: null,
      })),
    );
    const { getByText } = renderWithMSW(
      <SubmissionMediaCard submission={mockSubmission} title="Submission" />,
    );
    await waitFor(() => expect(getByText("G")).toBeTruthy());
  });

  it("renders the video player for a video submission", async () => {
    const videoSubmission: VotingSubmission = {
      ...mockSubmission,
      imagePath: null,
      videoPath: "submission-videos/group-a.mp4",
    };

    const { getByTestId } = renderWithMSW(
      <SubmissionMediaCard submission={videoSubmission} title="Submission" />,
    );

    await waitFor(() =>
      expect(getByTestId("submission-video-player")).toHaveTextContent(
        "submission-videos/group-a.mp4",
      ),
    );
  });

  it("renders the text answer when the submission has no media", async () => {
    const textSubmission: VotingSubmission = {
      ...mockSubmission,
      imagePath: null,
      videoPath: null,
      textContent: "Our answer is 42",
    };

    const { getByText } = renderWithMSW(
      <SubmissionMediaCard submission={textSubmission} title="Submission" />,
    );

    await waitFor(() => expect(getByText("Our answer is 42")).toBeTruthy());
  });
});
