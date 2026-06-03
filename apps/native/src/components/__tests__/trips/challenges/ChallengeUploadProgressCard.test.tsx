import { screen } from "@testing-library/react-native";
import { ActivityIndicator, View } from "react-native";
import { ChallengeUploadProgressCard } from "../../../trips/challenges/ChallengeUploadProgressCard";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ChallengeUploadProgressCard", () => {
  it("should render title", () => {
    renderWithProviders(<ChallengeUploadProgressCard />);
    expect(screen.getByText("Uploading submission")).toBeOnTheScreen();
  });

  it("should render ActivityIndicator", () => {
    renderWithProviders(<ChallengeUploadProgressCard />);
    const activityIndicator = screen.getByTestId("upload-progress-indicator");
    expect(activityIndicator).toBeTruthy();
  });

  it("should show 'Preparing upload...' when progress is null", () => {
    renderWithProviders(<ChallengeUploadProgressCard progress={null} />);
    expect(screen.getByText("Preparing upload...")).toBeOnTheScreen();
  });

  it("should show 'Preparing upload...' when progress is undefined", () => {
    renderWithProviders(<ChallengeUploadProgressCard />);
    expect(screen.getByText("Preparing upload...")).toBeOnTheScreen();
  });

  it("should show percentage when progress is 0", () => {
    renderWithProviders(<ChallengeUploadProgressCard progress={0} />);
    expect(screen.getByText("0%")).toBeOnTheScreen();
  });

  it("should show percentage when progress is 0.5", () => {
    renderWithProviders(<ChallengeUploadProgressCard progress={0.5} />);
    expect(screen.getByText("50%")).toBeOnTheScreen();
  });

  it("should show 100% when progress is 1", () => {
    renderWithProviders(<ChallengeUploadProgressCard progress={1} />);
    expect(screen.getByText("100%")).toBeOnTheScreen();
  });

  it("should clamp progress to 0 when negative", () => {
    renderWithProviders(<ChallengeUploadProgressCard progress={-0.5} />);
    expect(screen.getByText("0%")).toBeOnTheScreen();
  });

  it("should clamp progress to 100% when greater than 1", () => {
    renderWithProviders(<ChallengeUploadProgressCard progress={1.5} />);
    expect(screen.getByText("100%")).toBeOnTheScreen();
  });

  it("should render progress bar track", () => {
    renderWithProviders(<ChallengeUploadProgressCard progress={0.5} />);
    const view = screen.getByTestId("progress-track");
    expect(view).toBeTruthy();
  });

  it("should render with correct container styling", () => {
    renderWithProviders(<ChallengeUploadProgressCard progress={0.5} />);
    const view = screen.getByTestId("upload-progress-card");
    expect(view.props.style).toBeTruthy();
  });
});
