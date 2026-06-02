import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { SubmissionImageCard } from "../../admin/challenges/SubmissionImageCard";
import type { VotingSubmission } from "~/hooks/admin/useStaffVoting";

const mockUseQuery = jest.fn();
const mockCreateDownloadUrlQueryOptions = jest.fn(
  (options: { input: { storagePath: string }; enabled?: boolean }) => ({
    queryKey: ["storage", "createDownloadUrl", options.input.storagePath],
    enabled: options.enabled,
  }),
);

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    storage: {
      createDownloadUrl: {
        queryOptions: (options: { input: { storagePath: string }; enabled?: boolean }) =>
          mockCreateDownloadUrlQueryOptions(options),
      },
    },
  },
}));

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  };
});

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
  });

  it("renders the title and group name", () => {
    mockUseQuery.mockReturnValue({
      data: { signedUrl: "https://example.com/image.jpg" },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(
      <SubmissionImageCard submission={mockSubmission} title="Submission" />,
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
      <SubmissionImageCard submission={mockSubmission} title="Submission" onPress={onPress} />,
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
      <SubmissionImageCard submission={mockSubmission} title="Submission" />,
    );

    expect(getByText("G")).toBeTruthy();
  });
});
