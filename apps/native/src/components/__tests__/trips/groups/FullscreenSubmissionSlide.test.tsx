import { renderWithProviders } from "../../helpers/renderWithProviders";

const mockDownload = jest.fn(() => Promise.resolve());
const mockReset = jest.fn();
const mockAbort = jest.fn();

let mockFileDownloadReturn: {
  download: jest.Mock;
  status: string;
  file: { uri: string } | null;
  reset: jest.Mock;
  abort: jest.Mock;
} = {
  download: mockDownload,
  status: "idle",
  file: null,
  reset: mockReset,
  abort: mockAbort,
};

jest.mock("~/hooks/files", () => ({
  useFileDownload: () => mockFileDownloadReturn,
}));

const FullscreenSubmissionSlide = require("../../../trips/groups/details/FullscreenSubmissionSlide").default;
const { formatDateTime } = require("../../../trips/groups/details/FullscreenSubmissionSlide");

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
    mockFileDownloadReturn = {
      download: mockDownload,
      status: "idle",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    };
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

  it("shows loading indicator when downloading", () => {
    mockFileDownloadReturn = {
      download: mockDownload,
      status: "loading",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    };

    const { getByTestId } = renderWithProviders(
      <FullscreenSubmissionSlide
        submission={baseSubmission()}
        width={400}
        height={800}
        topInset={50}
      />,
    );

    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders image when file is loaded", () => {
    mockFileDownloadReturn = {
      download: mockDownload,
      status: "success",
      file: { uri: "file:///path/to/image.jpg" },
      reset: mockReset,
      abort: mockAbort,
    };

    const { getByTestId } = renderWithProviders(
      <FullscreenSubmissionSlide
        submission={baseSubmission()}
        width={400}
        height={800}
        topInset={50}
      />,
    );

    expect(getByTestId("fullscreen-image")).toBeTruthy();
  });

  it("shows fallback when no image path", () => {
    mockFileDownloadReturn = {
      download: mockDownload,
      status: "idle",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    };

    const { getByTestId } = renderWithProviders(
      <FullscreenSubmissionSlide
        submission={baseSubmission({ imageStoragePath: "" })}
        width={400}
        height={800}
        topInset={50}
      />,
    );

    expect(getByTestId("image-fallback")).toBeTruthy();
  });
});
