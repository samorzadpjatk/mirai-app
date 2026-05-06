import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { useTRPC } from "@mirai-app/trpc/client";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SubmissionImageCard } from "../../admin/challenges/SubmissionImageCard";
import * as ReactQuery from "@tanstack/react-query";

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(),
}));

const mockUseQuery = jest.fn();
jest.spyOn(ReactQuery, "useQuery").mockImplementation((...args: unknown[]) => mockUseQuery(...args) as ReturnType<typeof ReactQuery.useQuery>);

describe("SubmissionImageCard", () => {
  interface Submission {
    imagePath: string;
    groupName: string;
  }
  const mockSubmission: Submission = {
    imagePath: "submission-images/group-a.jpg",
    groupName: "Group A",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTRPC as jest.Mock).mockReturnValue({
      storage: {
        createDownloadUrl: {
          queryOptions: ({ storagePath }: { storagePath: string }) => ({
            queryKey: [storagePath],
          }),
        },
      },
    });
  });

  it("renders the title and group name", () => {
    mockUseQuery.mockReturnValue({
      data: { signedUrl: "https://example.com/image.jpg" },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(
      <SubmissionImageCard submission={mockSubmission} title="Submission" />
    );

    expect(getByText("Submission")).toBeTruthy();
    expect(getByText("Group A")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    mockUseQuery.mockReturnValue({
      data: { signedUrl: "https://example.com/image.jpg" },
      isLoading: false,
    });
    const onPress = jest.fn();

    const { getByText } = renderWithProviders(
      <SubmissionImageCard
        submission={mockSubmission}
        title="Submission"
        onPress={onPress}
      />
    );

    fireEvent.press(getByText("Submission"));
    await waitFor(() => expect(onPress).toHaveBeenCalled());
  });

  it("shows a fallback initial when the image is unavailable", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { getByText } = renderWithProviders(
      <SubmissionImageCard submission={mockSubmission} title="Submission" />
    );

    expect(getByText("G")).toBeTruthy();
  });
});
