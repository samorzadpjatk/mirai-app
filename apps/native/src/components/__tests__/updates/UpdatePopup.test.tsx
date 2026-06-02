import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { UpdatePopup } from "../../updates/UpdatePopup";

describe("UpdatePopup", () => {
  it("renders update popup when visible", () => {
    renderWithProviders(
      <UpdatePopup visible={true} onUpdate={jest.fn()} onSkip={jest.fn()} />,
    );

    expect(screen.getAllByText("Update Available").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("A new version of MIRAI is available with improvements and bug fixes."),
    ).toBeOnTheScreen();
  });

  it("calls onUpdate when update button pressed", async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <UpdatePopup visible={true} onUpdate={onUpdate} onSkip={jest.fn()} />,
    );

    await user.press(screen.getByText("Update Now"));
    expect(onUpdate).toHaveBeenCalled();
  });

  it("calls onSkip when skip button pressed", async () => {
    const onSkip = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <UpdatePopup visible={true} onUpdate={jest.fn()} onSkip={onSkip} />,
    );

    await user.press(screen.getByText("Skip"));
    expect(onSkip).toHaveBeenCalled();
  });

  it("shows downloading state", () => {
    renderWithProviders(
      <UpdatePopup
        visible={true}
        onUpdate={jest.fn()}
        onSkip={jest.fn()}
        isDownloading={true}
        downloadProgress={0.5}
      />,
    );

    expect(screen.getByText("Skip")).toBeOnTheScreen();
    expect(screen.getByText("Downloading... 50%")).toBeOnTheScreen();
  });
});
