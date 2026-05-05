import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/trpc/client";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SubmissionImageCard } from "../../admin/challenges/SubmissionImageCard";

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(),
}));

describe("SubmissionImageCard", () => {
  const mockSubmission = {
    imagePath: "submission-images/group-a.jpg",
    groupName: "Group A",
  } as any;

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
    jest.spyOn(require("@tanstack/react-query"), "useQuery").mockReturnValue({
      data: { signedUrl: "https://example.com/image.jpg" },
      isLoading: false,
    } as any);

    const { getByText } = renderWithProviders(
      <SubmissionImageCard submission={mockSubmission} title="Submission" />
    );

    expect(getByText("Submission")).toBeTruthy();
    expect(getByText("Group A")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    jest.spyOn(require("@tanstack/react-query"), "useQuery").mockReturnValue({
      data: { signedUrl: "https://example.com/image.jpg" },
      isLoading: false,
    } as any);
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
    jest.spyOn(require("@tanstack/react-query"), "useQuery").mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    const { getByText } = renderWithProviders(
      <SubmissionImageCard submission={mockSubmission} title="Submission" />
    );

    expect(getByText("G")).toBeTruthy();
  });
});
