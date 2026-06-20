import { waitFor } from "@testing-library/react-native";
import FullscreenSubmissionSlide, {
  formatDateTime,
} from "../../../trips/groups/details/FullscreenSubmissionSlide";
import { renderWithProviders } from "../../helpers/renderWithProviders";

const baseSubmission = (overrides = {}) => ({
  submissionId: "sub-1",
  challengeId: "challenge-1",
  challengeTitle: "Test Challenge",
  imageStoragePath: "path/to/image.jpg",
  approvedAt: "2024-01-15T10:30:00Z",
  ...overrides,
});

describe("FullscreenSubmissionSlide", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders challenge title", () => {
    const { getByText } = renderWithProviders(
      <FullscreenSubmissionSlide
        submission={baseSubmission()}
        width={400}
        height={800}
        topInset={50}
      />,
    );

    expect(getByText("Test Challenge")).toBeTruthy();
  });

  it("formats date correctly", () => {
    const result = formatDateTime("2024-01-15T10:30:00Z");
    expect(result).not.toBe("Unknown date");
  });

  it("returns Unknown date for invalid input", () => {
    expect(formatDateTime("invalid")).toBe("Unknown date");
    expect(formatDateTime(new Date(NaN))).toBe("Unknown date");
  });

  it("shows loading indicator while image url is loading", () => {
    const { getByTestId } = renderWithProviders(
      <FullscreenSubmissionSlide
        submission={baseSubmission()}
        width={400}
        height={800}
        topInset={50}
      />,
    );

    expect(getByTestId("image-fallback")).toBeTruthy();
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders image when url resolves", async () => {
    const { getByTestId } = renderWithProviders(
      <FullscreenSubmissionSlide
        submission={baseSubmission()}
        width={400}
        height={800}
        topInset={50}
      />,
    );

    await waitFor(() => expect(getByTestId("fullscreen-image")).toBeTruthy());
  });

  it("shows fallback when no image path", () => {
    const { getByTestId } = renderWithProviders(
      <FullscreenSubmissionSlide
        submission={baseSubmission({ imageStoragePath: null })}
        width={400}
        height={800}
        topInset={50}
      />,
    );

    expect(getByTestId("image-fallback")).toBeTruthy();
  });
});
