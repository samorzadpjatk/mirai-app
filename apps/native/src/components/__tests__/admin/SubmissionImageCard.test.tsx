import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/react-native";
import type { VotingSubmission } from "~/hooks/admin/useStaffVoting";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderWithMSW } from "../../../test-utils/msw/test-wrapper";
import { SubmissionImageCard } from "../../admin/challenges/SubmissionImageCard";

describe("SubmissionImageCard", () => {
  const mockSubmission: VotingSubmission = {
    id: "submission-1",
    groupId: "group-1",
    imagePath: "submission-images/group-a.jpg",
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
      <SubmissionImageCard submission={mockSubmission} title="Submission" />,
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
      <SubmissionImageCard submission={mockSubmission} title="Submission" onPress={onPress} />,
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
      <SubmissionImageCard submission={mockSubmission} title="Submission" />,
    );
    await waitFor(() => expect(getByText("G")).toBeTruthy());
  });
});
