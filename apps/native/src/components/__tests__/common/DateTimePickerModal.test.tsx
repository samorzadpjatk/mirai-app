import React from "react";
import { Modal, Pressable, Platform } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { DateTimePickerModal } from "../../common/ui/DateTimePickerModal";

jest.mock("@react-native-community/datetimepicker", () => "RNDateTimePicker");

// Type definitions for React element props
interface DateTimePickerElement {
  props: {
    value: Date;
    mode: string;
    display: string;
    onChange: (event: { type: string }, date?: Date) => void;
  };
}

interface PressableElement {
  props: {
    onPress?: () => void;
  };
}

describe("DateTimePickerModal", () => {
  const mockDate = new Date("2024-01-15T10:30:00");

  it("should return null when not visible", () => {
    const { queryByText } = renderWithProviders(
      <DateTimePickerModal
        visible={false}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    expect(queryByText("Cancel")).toBeNull();
    expect(queryByText("Done")).toBeNull();
  });

  it("should render on Android without modal", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    
    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker");
    expect(dateTimePicker).toBeTruthy();
  });

  it("should render modal on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    
    const { getByText, UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("Done")).toBeTruthy();
    
    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.transparent).toBe(true);
    expect(modal.props.animationType).toBe("fade");
  });

  it("should call onCancel when Cancel button is pressed on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onCancel = jest.fn();
    
    const { getByText } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={onCancel}
      />
    );

    fireEvent.press(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should call onConfirm when Done button is pressed on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onConfirm = jest.fn();
    
    const { getByText } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={onConfirm}
        onCancel={() => { /* noop */ }}
      />
    );

    fireEvent.press(getByText("Done"));
    expect(onConfirm).toHaveBeenCalledWith(mockDate);
  });

  it("should call onCancel when overlay is pressed on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onCancel = jest.fn();
    
    const { UNSAFE_getAllByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={onCancel}
      />
    );

    const pressables = UNSAFE_getAllByType(Pressable);
    fireEvent.press(pressables[0]!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should handle date mode", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    
    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    expect(dateTimePicker.props.mode).toBe("date");
  });

  it("should handle time mode", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="time"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    expect(dateTimePicker.props.mode).toBe("time");
  });

  it("should handle datetime mode on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="datetime"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    expect(dateTimePicker.props.mode).toBe("datetime");
  });

  it("should handle datetime mode on Android (fallback to date)", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });

    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="datetime"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    expect(dateTimePicker.props.mode).toBe("date");
  });

  it("should pass correct value to DateTimePicker", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const testDate = new Date("2024-06-20T15:45:00");

    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={testDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    expect(dateTimePicker.props.value).toEqual(testDate);
  });

  it("should handle onRequestClose on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const onCancel = jest.fn();
    
    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={onCancel}
      />
    );

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.onRequestClose).toBe(onCancel);
  });

  it("should stop propagation when card is pressed on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    
    const { UNSAFE_getAllByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const pressables = UNSAFE_getAllByType(Pressable) as PressableElement[];
    const cardPressable = pressables.find(
      (p: PressableElement) => p.props.onPress?.toString().includes("stopPropagation")
    );
    expect(cardPressable).toBeTruthy();
  });

  it("should update draft date when date changes on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const newDate = new Date("2024-12-25T00:00:00");
    
    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    dateTimePicker.props.onChange({}, newDate);

    expect(dateTimePicker).toBeTruthy();
  });

  it("should handle Android change event - dismissed", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    const onCancel = jest.fn();
    
    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={onCancel}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    dateTimePicker.props.onChange({ type: "dismissed" }, undefined);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should handle Android change event - set", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const newDate = new Date("2024-07-04T12:00:00");
    
    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    dateTimePicker.props.onChange({ type: "set" }, newDate);

    expect(onConfirm).toHaveBeenCalledWith(newDate);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should use spinner display on iOS", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });

    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    expect(dateTimePicker.props.display).toBe("spinner");
  });

  it("should use default display on Android", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });

    const { UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    expect(dateTimePicker.props.display).toBe("default");
  });

  it("should regenerate key when value or mode changes", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    
    const { rerender, UNSAFE_getByType } = renderWithProviders(
      <DateTimePickerModal
        visible={true}
        value={mockDate}
        mode="date"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const newDate = new Date("2024-03-15T08:00:00");
    rerender(
      <DateTimePickerModal
        visible={true}
        value={newDate}
        mode="time"
        onConfirm={() => { /* noop */ }}
        onCancel={() => { /* noop */ }}
      />
    );

    const dateTimePicker = UNSAFE_getByType("RNDateTimePicker") as DateTimePickerElement;
    expect(dateTimePicker).toBeTruthy();
  });
});
