import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SubmissionReviewCard } from "../../admin/challenges/SubmissionReviewCard";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

const mockDownload = jest.fn();
const mockReset = jest.fn();
const mockAbort = jest.fn();

jest.mock("~/hooks/files", () => ({
  useFileDownload: () => ({
    download: mockDownload,
    status: "idle",
    file: null,
    reset: mockReset,
    abort: mockAbort,
  }),
}));

describe("SubmissionReviewCard", () => {
  const baseSubmission = {
    id: "sub-1",
    status: "PENDING" as const,
    ranking: null,
    imageIds: [],
    videoId: null,
    textContent: "Test submission content",
    createdAt: new Date("2024-01-01T10:00:00.000Z"),
    reviewedAt: null,
    rejectionReason: null,
    reviewedBy: null,
    group: {
      id: "group-1",
      name: "Test Group",
      image: null,
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders submission data", () => {
    const { getByText } = renderWithProviders(
      <SubmissionReviewCard
        submission={baseSubmission}
        isReviewing={false}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );

    expect(getByText("Test Group")).toBeTruthy();
    expect(getByText("Test submission content")).toBeTruthy();
    expect(getByText("Set approved")).toBeTruthy();
    expect(getByText("Set rejected")).toBeTruthy();
  });

  it("calls handlers from action buttons", () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();
    const { getByText } = renderWithProviders(
      <SubmissionReviewCard
        submission={baseSubmission}
        isReviewing={false}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    fireEvent.press(getByText("Set approved"));
    fireEvent.press(getByText("Set rejected"));

    expect(onApprove).toHaveBeenCalledWith(baseSubmission);
    expect(onReject).toHaveBeenCalledWith(baseSubmission);
  });

  it("hides approve button when approved and shows reviewer info", () => {
    const approved = {
      ...baseSubmission,
      status: "APPROVED" as const,
      reviewedAt: new Date("2024-01-02T10:00:00.000Z"),
      reviewedBy: { firstName: "Admin", lastName: "User", email: "admin@example.com" },
    };

    const { getByText, queryByText } = renderWithProviders(
      <SubmissionReviewCard
        submission={approved}
        isReviewing={false}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );

    expect(getByText(/Admin User/)).toBeTruthy();
    expect(queryByText("Set approved")).toBeNull();
    expect(getByText("Set rejected")).toBeTruthy();
  });

  it("shows rejection reason for rejected submissions", () => {
    const rejected = {
      ...baseSubmission,
      status: "REJECTED" as const,
      rejectionReason: "Invalid submission",
    };
    const { getByText, queryByText } = renderWithProviders(
      <SubmissionReviewCard
        submission={rejected}
        isReviewing={false}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );

    expect(getByText("Invalid submission")).toBeTruthy();
    expect(queryByText("Set rejected")).toBeNull();
  });
});
