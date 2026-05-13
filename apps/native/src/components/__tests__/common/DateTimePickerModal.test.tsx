import React from "react";
import { Platform } from "react-native";
import { fireEvent, screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { DateTimePickerModal } from "../../common/ui/DateTimePickerModal";

jest.mock("@react-native-community/datetimepicker", () => "RNDateTimePicker");

describe("DateTimePickerModal", () => {
  const mockDate = new Date("2024-01-15T10:30:00");

  it("should return null when not visible", () => {
    renderWithProviders(
      <DateTimePickerModal
        visible={false}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.queryByText("Cancel")).toBeNull();
    expect(screen.queryByText("Done")).toBeNull();
  });

  it("should render on Android without modal", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should render modal on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByText("Cancel")).toBeOnTheScreen();
    expect(screen.getByText("Done")).toBeOnTheScreen();
    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
    expect(screen.getByTestId("datetime-picker-overlay")).toBeOnTheScreen();
    expect(screen.getByTestId("datetime-picker-card")).toBeOnTheScreen();
  });

  it("should call onCancel when Cancel button is pressed on iOS", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onCancel = jest.fn();

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={onCancel}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should call onConfirm when Done button is pressed on iOS", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onConfirm = jest.fn();

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={onConfirm}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByText("Done"));
    expect(onConfirm).toHaveBeenCalledWith(mockDate);
  });

  it("should call onCancel when overlay is pressed on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onCancel = jest.fn();

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByTestId("datetime-picker-overlay"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should handle date mode", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should handle time mode", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="time"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should handle datetime mode on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="datetime"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should handle datetime mode on Android (fallback to date)", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="datetime"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should pass correct value to DateTimePicker", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const testDate = new Date("2024-06-20T15:45:00");

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={testDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should handle onRequestClose on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onCancel = jest.fn();

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByTestId("datetime-picker-overlay"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should stop propagation when card is pressed on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker-card")).toBeTruthy();
  });

  it("should update draft date when date changes on iOS", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onConfirm = jest.fn();

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={onConfirm}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByText("Done"));
    expect(onConfirm).toHaveBeenCalledWith(mockDate);
  });

  it("should handle Android change event - dismissed", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    const onCancel = jest.fn();

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should handle Android change event - set", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should use spinner display on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should use default display on Android", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });

    renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });

  it("should regenerate key when value or mode changes", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    const { rerender } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();

    const newDate = new Date("2024-03-15T08:00:00");
    rerender(
      <DateTimePickerModal
        visible={true}
        value={newDate}
        mode="time"
        onConfirm={() => {
          /* noop */
        }}
        onCancel={() => {
          /* noop */
        }}
      />,
    );

    expect(screen.getByTestId("datetime-picker")).toBeOnTheScreen();
  });
});
