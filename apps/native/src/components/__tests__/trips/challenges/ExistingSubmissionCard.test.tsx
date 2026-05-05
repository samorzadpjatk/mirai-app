import React from "react";
import { fireEvent } from "@testing-library/react-native";
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
  });

  it("renders submission details and withdraw action", () => {
    const { getByText } = renderWithProviders(
      <ExistingSubmissionCard submission={mockSubmission} isWithdrawing={false} onWithdraw={mockOnWithdraw} />
    );

    expect(getByText("Submission sent")).toBeTruthy();
    expect(getByText("Pending Review")).toBeTruthy();
    expect(getByText(/Submitted:/)).toBeTruthy();
    expect(getByText("Withdraw submission")).toBeTruthy();
  });

  it("shows the approved state instead of withdraw action", () => {
    const approvedSubmission = { ...mockSubmission, status: "APPROVED" as const };
    const { getByText, queryByText } = renderWithProviders(
      <ExistingSubmissionCard submission={approvedSubmission} isWithdrawing={false} onWithdraw={mockOnWithdraw} />
    );

    expect(getByText("Approved")).toBeTruthy();
    expect(getByText("Approved submissions cannot be withdrawn.")).toBeTruthy();
    expect(queryByText("Withdraw submission")).toBeNull();
  });

  it("renders rejection reason for rejected submissions", () => {
    const rejectedSubmission = {
      ...mockSubmission,
      status: "REJECTED" as const,
      rejectionReason: "Image quality too low",
    };
    const { getByText } = renderWithProviders(
      <ExistingSubmissionCard submission={rejectedSubmission} isWithdrawing={false} onWithdraw={mockOnWithdraw} />
    );

    expect(getByText("Rejected")).toBeTruthy();
    expect(getByText("Rejection reason: Image quality too low")).toBeTruthy();
  });

  it("renders the local preview when download file is missing", () => {
    mockDownloadedFileUri = null;
    const { UNSAFE_getByType } = renderWithProviders(
      <ExistingSubmissionCard
        submission={mockSubmission}
        isWithdrawing={false}
        onWithdraw={mockOnWithdraw}
        localPreviewUri="local-preview-uri"
      />
    );

    const image = UNSAFE_getByType(require("react-native").Image);
    expect(image.props.source.uri).toBe("local-preview-uri");
  });

  it("asks for confirmation before withdrawing", () => {
    const { getByText } = renderWithProviders(
      <ExistingSubmissionCard submission={mockSubmission} isWithdrawing={false} onWithdraw={mockOnWithdraw} />
    );

    fireEvent.press(getByText("Withdraw submission"));
    expect(require("react-native").Alert.alert).toHaveBeenCalled();
  });
});
