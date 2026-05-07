import React from "react";
import { Alert, Image } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ExistingSubmissionCard } from "../../../trips/challenges/ExistingSubmissionCard";

let mockDownloadedFileUri: string | null = "mock-uri";

jest.mock("~/hooks/files", () => ({
  useFileDownload: () => ({
    download: jest.fn().mockResolvedValue(undefined),
    status: "success",
    file: mockDownloadedFileUri ? { uri: mockDownloadedFileUri } : null,
    reset: jest.fn(),
    abort: jest.fn(),
  }),
}));

describe("ExistingSubmissionCard", () => {
  const mockSubmission = {
    id: "1",
    status: "PENDING" as const,
    createdAt: "2024-01-01T10:00:00Z",
    imageIds: ["image1"],
    rejectionReason: null,
  };

  const mockOnWithdraw = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDownloadedFileUri = "mock-uri";
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  it("renders submission details and withdraw action", () => {
    renderWithProviders(
      <ExistingSubmissionCard submission={mockSubmission} isWithdrawing={false} onWithdraw={mockOnWithdraw} />
    );

    expect(screen.getByText("Submission sent")).toBeOnTheScreen();
    expect(screen.getByText("Pending Review")).toBeOnTheScreen();
    expect(screen.getByText(/Submitted:/)).toBeOnTheScreen();
    expect(screen.getByText("Withdraw submission")).toBeOnTheScreen();
  });

  it("shows the approved state instead of withdraw action", () => {
    const approvedSubmission = { ...mockSubmission, status: "APPROVED" as const };
    renderWithProviders(
      <ExistingSubmissionCard submission={approvedSubmission} isWithdrawing={false} onWithdraw={mockOnWithdraw} />
    );

    expect(screen.getByText("Approved")).toBeOnTheScreen();
    expect(screen.getByText("Approved submissions cannot be withdrawn.")).toBeOnTheScreen();
    expect(screen.queryByText("Withdraw submission")).toBeNull();
  });

  it("renders rejection reason for rejected submissions", () => {
    const rejectedSubmission = {
      ...mockSubmission,
      status: "REJECTED" as const,
      rejectionReason: "Image quality too low",
    };
    renderWithProviders(
      <ExistingSubmissionCard submission={rejectedSubmission} isWithdrawing={false} onWithdraw={mockOnWithdraw} />
    );

    expect(screen.getByText("Rejected")).toBeOnTheScreen();
    expect(screen.getByText("Rejection reason: Image quality too low")).toBeOnTheScreen();
  });

  it("renders the local preview when download file is missing", () => {
    mockDownloadedFileUri = null;
    renderWithProviders(
      <ExistingSubmissionCard
        submission={mockSubmission}
        isWithdrawing={false}
        onWithdraw={mockOnWithdraw}
        localPreviewUri="local-preview-uri"
      />
    );

    const image = screen.getByLabelText("Submission preview");
    const source = image.props.source as { uri: string };
    expect(source.uri).toBe("local-preview-uri");
  });

  it("asks for confirmation before withdrawing", () => {
    renderWithProviders(
      <ExistingSubmissionCard submission={mockSubmission} isWithdrawing={false} onWithdraw={mockOnWithdraw} />
    );

    fireEvent.press(screen.getByText("Withdraw submission"));
    expect(Alert.alert).toHaveBeenCalled();
  });
});
