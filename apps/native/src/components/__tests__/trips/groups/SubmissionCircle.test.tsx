import { fireEvent, waitFor } from "@testing-library/react-native";
import SubmissionCircle from "../../../trips/groups/details/SubmissionCircle";
import { renderWithProviders } from "../../helpers/renderWithProviders";

const baseSubmission = (overrides = {}) => ({
  submissionId: "sub-1",
  challengeId: "challenge-1",
  challengeTitle: "Test Challenge",
  imageStoragePath: "path/to/image.jpg",
  approvedAt: "2024-01-15T10:30:00Z",
  ...overrides,
});

describe("SubmissionCircle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders challenge title", () => {
    const { getByText } = renderWithProviders(
      <SubmissionCircle submission={baseSubmission()} onPress={jest.fn()} />,
    );

    expect(getByText("Test Challenge")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <SubmissionCircle submission={baseSubmission()} onPress={onPress} />,
    );

    fireEvent.press(getByTestId("submission-circle"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows loading indicator while image url is loading", () => {
    const { getByTestId } = renderWithProviders(
      <SubmissionCircle submission={baseSubmission()} onPress={jest.fn()} />,
    );

    expect(getByTestId("image-fallback")).toBeTruthy();
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders image when url resolves", async () => {
    const { getByTestId } = renderWithProviders(
      <SubmissionCircle submission={baseSubmission()} onPress={jest.fn()} />,
    );

    await waitFor(() => expect(getByTestId("submission-image")).toBeTruthy());
  });

  it("shows fallback when no image path", () => {
    const { getByTestId } = renderWithProviders(
      <SubmissionCircle
        submission={baseSubmission({ imageStoragePath: null })}
        onPress={jest.fn()}
      />,
    );

    expect(getByTestId("image-fallback")).toBeTruthy();
  });
});
